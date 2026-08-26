import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  DeliveryStage,
  OrderStatus,
  PaymentMethod,
} from "@quickbite/types";
import { DELIVERY_OFFER_ACCEPT_TIMEOUT_SECONDS, OTP_LENGTH } from "@quickbite/config";
import { DeliveryEntity, DriverProfileEntity, UserEntity } from "../../database/entities";
import { RealtimeEmitterService } from "../websocket/realtime-emitter.service";
import { OrdersService } from "../orders/orders.service";

function randomOtp(): string {
  return Math.floor(Math.random() * 10 ** OTP_LENGTH)
    .toString()
    .padStart(OTP_LENGTH, "0");
}

const STAGE_TO_ORDER_STATUS: Partial<Record<DeliveryStage, OrderStatus>> = {
  [DeliveryStage.ASSIGNED]: OrderStatus.ASSIGNED,
  [DeliveryStage.PICKED_UP]: OrderStatus.PICKED_UP,
  [DeliveryStage.OUT_FOR_DELIVERY]: OrderStatus.ON_THE_WAY,
  [DeliveryStage.DELIVERED]: OrderStatus.DELIVERED,
};

const STAGE_ORDER = [
  DeliveryStage.ASSIGNED,
  DeliveryStage.ARRIVED_AT_RESTAURANT,
  DeliveryStage.PICKED_UP,
  DeliveryStage.OUT_FOR_DELIVERY,
  DeliveryStage.ARRIVED_AT_CUSTOMER,
  DeliveryStage.DELIVERED,
];

@Injectable()
export class DeliveryService {
  constructor(
    @InjectRepository(DeliveryEntity)
    private readonly deliveries: Repository<DeliveryEntity>,
    @InjectRepository(DriverProfileEntity)
    private readonly drivers: Repository<DriverProfileEntity>,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    private readonly realtime: RealtimeEmitterService,
    @Inject(forwardRef(() => OrdersService))
    private readonly orders: OrdersService,
  ) {}

  async createOfferForOrder(order: any) {
    const candidate = await this.drivers.findOne({ where: { isOnline: true } });
    if (!candidate) return null; // no driver available in this thin scaffold

    const distanceKm = Math.round((2 + Math.random() * 6) * 10) / 10;
    const delivery = await this.deliveries.save(
      this.deliveries.create({
        orderId: order.id,
        driverId: candidate.userId,
        stage: DeliveryStage.ASSIGNED,
        pickupOtp: randomOtp(),
        dropOtp: randomOtp(),
        basePay: 25,
        distancePay: Math.round(distanceKm * 8),
        surgeBonus: 0,
        tip: order.tipAmount ?? 0,
        distanceKm,
        offerExpiresAt: new Date(
          Date.now() + DELIVERY_OFFER_ACCEPT_TIMEOUT_SECONDS * 1000,
        ).toISOString(),
      }),
    );
    this.realtime.deliveryOffer(candidate.userId, delivery);
    return delivery;
  }

  async get(id: string) {
    const delivery = await this.deliveries.findOne({ where: { id } });
    if (!delivery) throw new NotFoundException("Delivery not found");
    return delivery;
  }

  async getByOrderId(orderId: string) {
    return this.deliveries.findOne({ where: { orderId } });
  }

  async getByOrderIdEnriched(orderId: string) {
    const delivery = await this.deliveries.findOne({ where: { orderId } });
    if (!delivery) return null;
    if (!delivery.driverId) return { ...delivery, driver: null };

    const [user, profile] = await Promise.all([
      this.users.findOne({ where: { id: delivery.driverId } }),
      this.drivers.findOne({ where: { userId: delivery.driverId } }),
    ]);
    return {
      ...delivery,
      driver: user
        ? {
            name: user.name,
            phone: user.phone,
            vehicleNumber: profile?.vehicleNumber,
            vehicleType: profile?.vehicleType,
            rating: profile?.rating,
          }
        : null,
    };
  }

  async respondToOffer(deliveryId: string, driverUserId: string, accept: boolean) {
    const delivery = await this.get(deliveryId);
    if (delivery.driverId !== driverUserId) {
      throw new ForbiddenException("This offer is not yours");
    }
    if (!accept) {
      await this.deliveries.update(deliveryId, { driverId: null as unknown as string });
      return { accepted: false };
    }
    await this.deliveries.update(deliveryId, { offerExpiresAt: null as unknown as string });
    const updated = await this.get(deliveryId);
    await this.orders.setStatusInternal(updated.orderId, OrderStatus.ASSIGNED);
    this.realtime.deliveryAssigned(updated.orderId, updated);
    return updated;
  }

  async listActiveForDriver(driverUserId: string) {
    return this.deliveries
      .createQueryBuilder("d")
      .where("d.driverId = :id", { id: driverUserId })
      .andWhere("d.stage != :delivered", { delivered: DeliveryStage.DELIVERED })
      .getMany();
  }

  async listHistoryForDriver(driverUserId: string) {
    return this.deliveries.find({
      where: { driverId: driverUserId, stage: DeliveryStage.DELIVERED },
      order: { updatedAt: "DESC" },
    });
  }

  async advanceStage(
    deliveryId: string,
    driverUserId: string,
    stage: DeliveryStage,
    otp?: string,
  ) {
    const delivery = await this.get(deliveryId);
    if (delivery.driverId !== driverUserId) {
      throw new ForbiddenException("Not your delivery");
    }

    const currentIdx = STAGE_ORDER.indexOf(delivery.stage);
    const nextIdx = STAGE_ORDER.indexOf(stage);
    if (nextIdx !== currentIdx + 1) {
      throw new BadRequestException("Invalid stage transition");
    }

    if (stage === DeliveryStage.PICKED_UP && otp !== delivery.pickupOtp) {
      throw new BadRequestException("Incorrect pickup OTP");
    }
    if (stage === DeliveryStage.DELIVERED && otp !== delivery.dropOtp) {
      throw new BadRequestException("Incorrect delivery OTP");
    }

    await this.deliveries.update(deliveryId, { stage });
    const updated = await this.get(deliveryId);

    const orderStatus = STAGE_TO_ORDER_STATUS[stage];
    if (orderStatus) {
      await this.orders.setStatusInternal(updated.orderId, orderStatus);
    }
    this.realtime.deliveryStageChanged(updated.orderId, driverUserId, updated);

    if (stage === DeliveryStage.DELIVERED) {
      const driver = await this.drivers.findOne({ where: { userId: driverUserId } });
      if (driver) {
        const order = await this.orders.get(updated.orderId);
        const codDelta = order.paymentMethod === PaymentMethod.COD ? order.grandTotal : 0;
        await this.drivers.update(driver.id, {
          codCashInHand: driver.codCashInHand + codDelta,
        });
      }
    }
    return updated;
  }

  async updateLocation(deliveryId: string, driverUserId: string, lat: number, lng: number) {
    const delivery = await this.get(deliveryId);
    if (delivery.driverId !== driverUserId) {
      throw new ForbiddenException("Not your delivery");
    }
    await this.drivers.update({ userId: driverUserId }, { currentLat: lat, currentLng: lng });
    this.realtime.deliveryLocationChanged(delivery.orderId, { lat, lng, deliveryId });
    return { success: true };
  }

  async setOnline(userId: string, isOnline: boolean) {
    let profile = await this.drivers.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException("Driver profile not found");
    }
    await this.drivers.update(profile.id, { isOnline });
    return this.drivers.findOne({ where: { userId } });
  }

  async myProfile(userId: string) {
    return this.drivers.findOne({ where: { userId } });
  }

  async earnings(userId: string) {
    const delivered = await this.deliveries.find({
      where: { driverId: userId, stage: DeliveryStage.DELIVERED },
    });
    const totals = delivered.reduce(
      (acc, d) => ({
        base: acc.base + d.basePay,
        distance: acc.distance + d.distancePay,
        surge: acc.surge + d.surgeBonus,
        tips: acc.tips + d.tip,
      }),
      { base: 0, distance: 0, surge: 0, tips: 0 },
    );
    const total = totals.base + totals.distance + totals.surge + totals.tips;
    return { tripsCompleted: delivered.length, ...totals, total };
  }
}
