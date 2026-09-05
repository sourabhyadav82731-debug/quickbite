import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, IsNull, Repository } from "typeorm";
import { randomInt } from "crypto";
import {
  DeliveryStage,
  OrderStatus,
  PaymentMethod,
  UserRole,
} from "@quickbite/types";
import { DELIVERY_OFFER_ACCEPT_TIMEOUT_SECONDS, OTP_LENGTH } from "@quickbite/config";
import {
  AddressEntity,
  DeliveryEntity,
  DriverProfileEntity,
  RestaurantEntity,
  UserEntity,
} from "../../database/entities";
import { RealtimeEmitterService } from "../websocket/realtime-emitter.service";
import { OrdersService } from "../orders/orders.service";

// crypto.randomInt is a CSPRNG (unlike Math.random) — appropriate for a value
// used as a security check, not just a display code.
function randomOtp(): string {
  return randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, "0");
}

// Sentinel written over pickupOtp once it's been successfully used. Never
// matches a real OTP (those are always OTP_LENGTH digits), so it blocks replay
// without requiring the column to become nullable (no migration needed).
const PICKUP_OTP_USED = "USED";

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

const NOT_YET_READY_STATUSES: OrderStatus[] = [
  OrderStatus.PAYMENT_PENDING,
  OrderStatus.PLACED,
  OrderStatus.ACCEPTED,
  OrderStatus.PREPARING,
];

/** pickupOtp must never leave this service toward a customer, driver, admin,
 *  or restaurant — it's restaurant/admin-only, served exclusively via
 *  getPickupOtpForOrder. dropOtp must never leave toward a driver, admin, or
 *  restaurant either — a driver who already knew it in advance could "verify"
 *  a delivery without the customer ever handing it over, defeating the whole
 *  point of it being proof-of-delivery. It reaches the frontend in exactly
 *  one place: getByOrderIdEnriched's explicit customer-only re-attachment
 *  below. Every other read path (enriched lookups, driver lists, realtime
 *  broadcasts — which fan out to the driver's and admin's rooms too, not
 *  just the customer's) goes through this so a new field added later can't
 *  accidentally leak either OTP. */
function redactOtps<T extends { pickupOtp?: string; dropOtp?: string }>(
  delivery: T,
): Omit<T, "pickupOtp" | "dropOtp"> {
  const { pickupOtp: _pickupOmit, dropOtp: _dropOmit, ...rest } = delivery;
  return rest;
}

@Injectable()
export class DeliveryService {
  // Ephemeral, in-process bookkeeping of which drivers a given delivery's offer
  // was broadcast to, so the winner's accept can tell the others to close their
  // popup. Deliberately not persisted (matches this scaffold's existing
  // single-process assumptions elsewhere, e.g. offerExpiresAt has no server-side
  // sweep) — acceptable for a dev/demo deployment, called out here for a future
  // production pass (would move to Redis or the DB behind a multi-instance API).
  private readonly offeredDriverIds = new Map<string, Set<string>>();

  constructor(
    @InjectRepository(DeliveryEntity)
    private readonly deliveries: Repository<DeliveryEntity>,
    @InjectRepository(DriverProfileEntity)
    private readonly drivers: Repository<DriverProfileEntity>,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(RestaurantEntity) private readonly restaurants: Repository<RestaurantEntity>,
    @InjectRepository(AddressEntity) private readonly addresses: Repository<AddressEntity>,
    private readonly realtime: RealtimeEmitterService,
    @Inject(forwardRef(() => OrdersService))
    private readonly orders: OrdersService,
  ) {}

  /** Idempotent find-or-create. deliveries.orderId is unique, so this is the
   *  only place a delivery row (and its OTPs) is ever inserted — both the
   *  automatic READY_FOR_PICKUP trigger and the restaurant's manual "Generate
   *  Pickup OTP" action funnel through here, so a repeat call from either path
   *  never creates a second row or overwrites an already-issued OTP. */
  private async ensureDeliveryForOrder(order: any): Promise<DeliveryEntity> {
    const existing = await this.deliveries.findOne({ where: { orderId: order.id } });
    if (existing) return existing;

    const distanceKm = Math.round((2 + Math.random() * 6) * 10) / 10;
    return this.deliveries.save(
      this.deliveries.create({
        orderId: order.id,
        stage: DeliveryStage.ASSIGNED,
        pickupOtp: randomOtp(),
        dropOtp: randomOtp(),
        basePay: 25,
        distancePay: Math.round(distanceKm * 8),
        surgeBonus: 0,
        tip: order.tipAmount ?? 0,
        distanceKm,
      }),
    );
  }

  /** Restaurant/admin-only. Returns the existing pickup OTP if one was already
   *  generated (e.g. by the automatic offer trigger) rather than minting a new
   *  one — an already-shared OTP must stay valid. */
  async getPickupOtpForOrder(orderId: string, actor: { userId: string; role: UserRole }) {
    const order = await this.orders.get(orderId);
    if (actor.role === UserRole.RESTAURANT_OWNER) {
      const restaurant = await this.restaurants.findOne({ where: { id: order.restaurantId } });
      if (restaurant?.ownerId !== actor.userId) {
        throw new ForbiddenException("Not your restaurant's order");
      }
    }
    if (NOT_YET_READY_STATUSES.includes(order.status)) {
      throw new BadRequestException(
        "Order must be marked Ready for Pickup before generating a pickup OTP",
      );
    }
    const delivery = await this.ensureDeliveryForOrder(order);
    return {
      deliveryId: delivery.id,
      pickupOtp: delivery.pickupOtp === PICKUP_OTP_USED ? null : delivery.pickupOtp,
      pickedUp: delivery.pickupOtp === PICKUP_OTP_USED,
    };
  }

  /** Broadcasts to every currently-eligible (online) driver at once — first to
   *  accept atomically wins in respondToOffer. Existing availability logic
   *  (isOnline) is unchanged; the one addition is excluding drivers who already
   *  have an active delivery (see the comment below for why that's not
   *  optional). */
  async createOfferForOrder(order: any) {
    const delivery = await this.ensureDeliveryForOrder(order);
    if (delivery.driverId) return delivery; // already claimed — nothing to offer

    const onlineDrivers = await this.drivers.find({ where: { isOnline: true } });
    // A driver already mid-delivery must not also be offered a second one —
    // without this, a driver can end up with several active delivery rows at
    // once, and "which one is this OTP for?" becomes genuinely ambiguous
    // (this is exactly what was causing correct pickup OTPs to be rejected:
    // the driver's app was silently acting on a different active delivery
    // than the one the restaurant had just generated the OTP for).
    const busyDriverIds = new Set(
      (
        await this.deliveries
          .createQueryBuilder("d")
          .select("DISTINCT d.driverId", "driverId")
          .where("d.driverId IS NOT NULL")
          .andWhere("d.stage != :delivered", { delivered: DeliveryStage.DELIVERED })
          .getRawMany()
      ).map((r) => r.driverId),
    );
    const eligibleDrivers = onlineDrivers.filter((d) => !busyDriverIds.has(d.userId));
    if (eligibleDrivers.length === 0) return delivery; // no free driver online right now — the row still exists for the restaurant's OTP flow and a later manual claim

    const expiresAt = new Date(
      Date.now() + DELIVERY_OFFER_ACCEPT_TIMEOUT_SECONDS * 1000,
    ).toISOString();
    await this.deliveries.update(delivery.id, { offerExpiresAt: expiresAt });

    this.offeredDriverIds.set(delivery.id, new Set(eligibleDrivers.map((d) => d.userId)));

    const restaurant = await this.restaurants.findOne({ where: { id: order.restaurantId } });
    // Deliberately excludes pickupOtp/dropOtp — a driver must never receive
    // either OTP before they've actually reached the corresponding checkpoint.
    const offerPayload = {
      id: delivery.id,
      orderId: delivery.orderId,
      restaurantName: restaurant?.name ?? "Restaurant",
      restaurantLat: restaurant?.lat,
      restaurantLng: restaurant?.lng,
      items: (order.items ?? []).map((i: any) => ({
        name: i.nameSnapshot,
        quantity: i.quantity,
      })),
      orderTotal: order.grandTotal,
      basePay: delivery.basePay,
      distancePay: delivery.distancePay,
      surgeBonus: delivery.surgeBonus,
      tip: delivery.tip,
      distanceKm: delivery.distanceKm,
      offerExpiresAt: expiresAt,
    };
    for (const driver of eligibleDrivers) {
      this.realtime.deliveryOffer(driver.userId, offerPayload);
    }
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

  // orderId is caller-supplied, and this is reachable by every non-admin
  // role, so it must scope to only the caller's own relationship to the
  // order — previously any authenticated customer/driver/restaurant owner
  // could read any other user's live delivery status (including driver name/
  // phone/vehicle) just by knowing an orderId.
  async getByOrderIdEnriched(orderId: string, actor: { userId: string; role: UserRole }) {
    const order = await this.orders.get(orderId).catch(() => null);
    if (!order) return null;
    if (actor.role !== UserRole.ADMIN) {
      if (actor.role === UserRole.CUSTOMER && order.customerId !== actor.userId) {
        throw new ForbiddenException("Not your order");
      }
      if (actor.role === UserRole.RESTAURANT_OWNER) {
        const restaurant = await this.restaurants.findOne({ where: { id: order.restaurantId } });
        if (restaurant?.ownerId !== actor.userId) {
          throw new ForbiddenException("Not your restaurant's order");
        }
      }
      // DELIVERY_PARTNER ownership is checked below once the delivery row
      // (and its driverId) is loaded — a driver isn't assigned yet, or a
      // delivery row may not exist yet, at order-lookup time.
    }

    const delivery = await this.deliveries.findOne({ where: { orderId } });
    if (!delivery) return null;
    if (actor.role === UserRole.DELIVERY_PARTNER && delivery.driverId !== actor.userId) {
      throw new ForbiddenException("Not your delivery");
    }
    // The one and only place dropOtp is meant to reach the frontend — the
    // customer needs it to hand to their driver. Every other role (including
    // the assigned driver themselves, and admin) gets it stripped like every
    // other read path in this service.
    const safe =
      actor.role === UserRole.CUSTOMER
        ? { ...redactOtps(delivery), dropOtp: delivery.dropOtp }
        : redactOtps(delivery);
    // Restaurant/drop coordinates for the map — same source
    // enrichDeliveryWithOrderInfo already uses for the driver-side view, so
    // both sides of the same delivery render the same two fixed points.
    const restaurant = await this.restaurants.findOne({ where: { id: order.restaurantId } });
    const address = order.addressId
      ? await this.addresses.findOne({ where: { id: order.addressId } })
      : null;
    const mapPoints = {
      restaurantLat: restaurant?.lat ?? null,
      restaurantLng: restaurant?.lng ?? null,
      dropLat: address?.lat ?? null,
      dropLng: address?.lng ?? null,
    };

    if (!delivery.driverId) return { ...safe, ...mapPoints, driver: null };

    const [user, profile] = await Promise.all([
      this.users.findOne({ where: { id: delivery.driverId } }),
      this.drivers.findOne({ where: { userId: delivery.driverId } }),
    ]);
    return {
      ...safe,
      ...mapPoints,
      driver: user
        ? {
            name: user.name,
            phone: user.phone,
            vehicleNumber: profile?.vehicleNumber,
            vehicleType: profile?.vehicleType,
            rating: profile?.rating,
            // Never present before OUT_FOR_DELIVERY (no driver.watchPosition
            // update has fired yet) — currentLat/Lng stay null until the
            // driver's first real GPS push, never a fake/zero coordinate.
            lat: profile?.currentLat ?? null,
            lng: profile?.currentLng ?? null,
            locationUpdatedAt: profile?.locationUpdatedAt ?? null,
          }
        : null,
    };
  }

  async respondToOffer(deliveryId: string, driverUserId: string, accept: boolean) {
    await this.get(deliveryId); // 404s if the delivery doesn't exist at all

    if (!accept) {
      this.offeredDriverIds.get(deliveryId)?.delete(driverUserId);
      return { accepted: false };
    }

    // Atomic claim: the WHERE clause's driverId IS NULL check means this UPDATE
    // affects a row only for whichever concurrent request gets there first —
    // that's the entire race-safety mechanism, not an app-level lock.
    const result = await this.deliveries.update(
      { id: deliveryId, driverId: IsNull() } as any,
      { driverId: driverUserId, offerExpiresAt: null as unknown as string },
    );
    if (!result.affected) {
      // A network retry from the same driver (request succeeded but the response
      // was lost) must not surface as a conflict — only a genuinely different
      // driver already holding the claim is one.
      const current = await this.get(deliveryId);
      if (current.driverId === driverUserId) {
        return redactOtps(current);
      }
      throw new ConflictException("This delivery has already been accepted by another driver");
    }

    const updated = await this.get(deliveryId);
    await this.orders.setStatusInternal(updated.orderId, OrderStatus.ASSIGNED, driverUserId);
    this.realtime.deliveryAssigned(updated.orderId, redactOtps(updated));

    const offered = this.offeredDriverIds.get(deliveryId);
    if (offered) {
      for (const otherDriverId of offered) {
        if (otherDriverId !== driverUserId) {
          this.realtime.deliveryOfferClosed(otherDriverId, deliveryId);
        }
      }
      this.offeredDriverIds.delete(deliveryId);
    }
    return redactOtps(updated);
  }

  /** Shared by both the active-delivery and trip-history lists — the driver UI
   *  needs to unambiguously identify which order a delivery row is (this was
   *  the actual root cause of a previous "correct pickup OTP rejected" bug:
   *  with no order identity shown and no deterministic ordering, the UI
   *  couldn't reliably tell the driver — or itself — which of possibly
   *  several active deliveries was the current one). Also attaches the
   *  per-trip earning using the same basePay+distancePay+surgeBonus+tip
   *  formula the existing earnings() aggregate already uses — not a new
   *  calculation, just applied per-row instead of summed. */
  private async enrichDeliveryWithOrderInfo(row: DeliveryEntity) {
    const safe = redactOtps(row);
    const order = await this.orders.get(row.orderId).catch(() => null);
    const restaurant = order
      ? await this.restaurants.findOne({ where: { id: order.restaurantId } })
      : null;
    // Drop coordinates for the "Navigate" action — reuses the customer's
    // already-saved address (same AddressEntity the checkout flow wrote),
    // no new address system. Never includes anything beyond lat/lng.
    const address = order?.addressId
      ? await this.addresses.findOne({ where: { id: order.addressId } })
      : null;
    return {
      ...safe,
      restaurantName: restaurant?.name ?? null,
      restaurantLat: restaurant?.lat ?? null,
      restaurantLng: restaurant?.lng ?? null,
      dropLat: address?.lat ?? null,
      dropLng: address?.lng ?? null,
      orderTotal: order?.grandTotal ?? null,
      items: (order?.items ?? []).map((i: any) => ({
        name: i.nameSnapshot,
        quantity: i.quantity,
      })),
      earning: row.basePay + row.distancePay + row.surgeBonus + row.tip,
    };
  }

  /** Restaurant-owner-facing "Active Deliveries" — everything from the
   *  moment a driver is assigned up to (not including) DELIVERED, scoped to
   *  this restaurant's own orders only. Reuses OrdersService.listForRestaurant
   *  (already ownership-agnostic at that layer) rather than a second
   *  order-repository dependency; ownership is enforced here. Never includes
   *  pickupOtp/dropOtp — same redactOtps every other read path uses. */
  async listActiveForRestaurant(restaurantId: string, actor: { userId: string; role: UserRole }) {
    const restaurant = await this.restaurants.findOne({ where: { id: restaurantId } });
    if (!restaurant) throw new NotFoundException("Restaurant not found");
    if (restaurant.ownerId !== actor.userId && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Not your restaurant");
    }

    const orders = await this.orders.listForRestaurant(restaurantId);
    const activeOrderIds = orders
      .filter((o: any) =>
        [OrderStatus.ASSIGNED, OrderStatus.PICKED_UP, OrderStatus.ON_THE_WAY].includes(o.status),
      )
      .map((o: any) => o.id);
    if (activeOrderIds.length === 0) return [];

    const rows = await this.deliveries.find({ where: { orderId: In(activeOrderIds) } });
    return Promise.all(
      rows.map(async (row) => {
        const safe = redactOtps(row);
        if (!row.driverId) return { ...safe, driver: null };
        const [user, profile] = await Promise.all([
          this.users.findOne({ where: { id: row.driverId } }),
          this.drivers.findOne({ where: { userId: row.driverId } }),
        ]);
        return {
          ...safe,
          driver: user
            ? {
                name: user.name,
                vehicleNumber: profile?.vehicleNumber,
                lat: profile?.currentLat ?? null,
                lng: profile?.currentLng ?? null,
                locationUpdatedAt: profile?.locationUpdatedAt ?? null,
              }
            : null,
        };
      }),
    );
  }

  // Explicit ORDER BY makes "the most recent" deterministic if more than one
  // row is ever active at once.
  async listActiveForDriver(driverUserId: string) {
    const rows = await this.deliveries
      .createQueryBuilder("d")
      .where("d.driverId = :id", { id: driverUserId })
      .andWhere("d.stage != :delivered", { delivered: DeliveryStage.DELIVERED })
      .orderBy("d.createdAt", "DESC")
      .getMany();
    return Promise.all(rows.map((row) => this.enrichDeliveryWithOrderInfo(row)));
  }

  async listHistoryForDriver(driverUserId: string) {
    const rows = await this.deliveries.find({
      where: { driverId: driverUserId, stage: DeliveryStage.DELIVERED },
      order: { updatedAt: "DESC" },
    });
    return Promise.all(rows.map((row) => this.enrichDeliveryWithOrderInfo(row)));
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

    // Normalized comparison: the OTP is a security check, not just a display
    // value, so it's compared as a trimmed string on both sides — never coerced
    // to a number (which would silently drop leading zeros and falsely accept
    // e.g. "0123" as matching 123).
    const submittedOtp = typeof otp === "string" ? otp.trim() : otp;

    if (stage === DeliveryStage.PICKED_UP) {
      if (!delivery.pickupOtp) {
        // Shouldn't happen — pickupOtp is always set at delivery-creation time —
        // but if it ever does, fail loudly rather than silently comparing
        // against an empty/falsy value that could coincidentally "match".
        throw new BadRequestException(
          "No pickup OTP has been generated for this delivery yet. Ask the restaurant to generate one.",
        );
      }
      if (delivery.pickupOtp === PICKUP_OTP_USED) {
        throw new BadRequestException("This pickup OTP has already been used");
      }
      if (submittedOtp !== delivery.pickupOtp) {
        throw new BadRequestException("Incorrect pickup OTP");
      }
    }
    if (stage === DeliveryStage.DELIVERED && submittedOtp !== delivery.dropOtp) {
      throw new BadRequestException("Incorrect delivery OTP");
    }

    await this.deliveries.update(deliveryId, {
      stage,
      // Invalidate immediately on successful use so it can never be replayed,
      // even though the stage-order check above already blocks a normal retry.
      ...(stage === DeliveryStage.PICKED_UP ? { pickupOtp: PICKUP_OTP_USED } : {}),
      ...(stage === DeliveryStage.DELIVERED ? { deliveredAt: new Date().toISOString() } : {}),
    });
    const updated = await this.get(deliveryId);

    const orderStatus = STAGE_TO_ORDER_STATUS[stage];
    if (orderStatus) {
      await this.orders.setStatusInternal(updated.orderId, orderStatus, driverUserId);
    }
    this.realtime.deliveryStageChanged(updated.orderId, driverUserId, redactOtps(updated));

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
    return redactOtps(updated);
  }

  async updateLocation(deliveryId: string, driverUserId: string, lat: number, lng: number) {
    const delivery = await this.get(deliveryId);
    if (delivery.driverId !== driverUserId) {
      throw new ForbiddenException("Not your delivery");
    }
    // Only an active (not yet DELIVERED) delivery may ever push a location —
    // once a trip is done, its last position stays where it was and can no
    // longer be overwritten by that driver for this deliveryId.
    if (delivery.stage === DeliveryStage.DELIVERED) {
      throw new BadRequestException("This delivery has already been completed");
    }
    const updatedAt = new Date().toISOString();
    await this.drivers.update(
      { userId: driverUserId },
      { currentLat: lat, currentLng: lng, locationUpdatedAt: updatedAt },
    );
    this.realtime.deliveryLocationChanged(delivery.orderId, {
      lat,
      lng,
      deliveryId,
      updatedAt,
    });
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

  // Extended with today/week breakdowns for the dashboard + wallet views, but
  // every field this already returned (tripsCompleted, base, distance, surge,
  // tips, total) is untouched — apps/web/app/delivery/{page,earnings,payouts}.tsx
  // already depend on that exact shape.
  async earnings(userId: string) {
    const delivered = await this.deliveries.find({
      where: { driverId: userId, stage: DeliveryStage.DELIVERED },
    });

    const perTripEarning = (d: DeliveryEntity) => d.basePay + d.distancePay + d.surgeBonus + d.tip;
    const sumEarnings = (rows: DeliveryEntity[]) => rows.reduce((s, d) => s + perTripEarning(d), 0);

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

    // "Completed at" is deliveredAt (an app-generated ISO string, set by
    // advanceStage's own DELIVERED transition — see DeliveryEntity's
    // comment on why this is deliberately not `updatedAt`). Rows delivered
    // before that column existed fall back to updatedAt as a best-effort
    // approximation rather than being silently excluded from every total.
    const completedAt = (d: DeliveryEntity) => new Date(d.deliveredAt ?? d.updatedAt);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(startOfToday);
    const isoDayOffset = (startOfToday.getDay() + 6) % 7; // Monday-start week
    startOfWeek.setDate(startOfToday.getDate() - isoDayOffset);
    const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);

    const todayDeliveries = delivered.filter((d) => completedAt(d) >= startOfToday);
    const weekDeliveries = delivered.filter((d) => completedAt(d) >= startOfWeek);
    const monthDeliveries = delivered.filter((d) => completedAt(d) >= startOfMonth);

    return {
      tripsCompleted: delivered.length,
      ...totals,
      total,
      todayTrips: todayDeliveries.length,
      weekTrips: weekDeliveries.length,
      monthTrips: monthDeliveries.length,
      todayEarnings: sumEarnings(todayDeliveries),
      weekEarnings: sumEarnings(weekDeliveries),
      monthEarnings: sumEarnings(monthDeliveries),
    };
  }
}
