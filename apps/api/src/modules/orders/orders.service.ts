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
import { v4 as uuid } from "uuid";
import { CouponType, OrderStatus, PaymentMethod, PaymentStatus, UserRole } from "@quickbite/types";
import {
  DELIVERY_FEE_BASE,
  FREE_DELIVERY_THRESHOLD,
  GST_RATE,
  PACKAGING_FEE,
  PLATFORM_FEE,
} from "@quickbite/config";
import { CheckoutInput } from "@quickbite/validation";
import {
  CouponEntity,
  DishEntity,
  OrderEntity,
  OrderItemEntity,
  PaymentEntity,
  RestaurantEntity,
} from "../../database/entities";
import { RealtimeEmitterService } from "../websocket/realtime-emitter.service";
import { DeliveryService } from "../delivery/delivery.service";
import { PaymentsService } from "../payments/payments.service";
import { RestaurantsService } from "../restaurants/restaurants.service";
import { OrderHistoryService, HistoryActorType } from "../order-history/order-history.service";

const ROLE_TO_ACTOR_TYPE: Record<UserRole, HistoryActorType> = {
  [UserRole.CUSTOMER]: "CUSTOMER",
  [UserRole.RESTAURANT_OWNER]: "RESTAURANT",
  [UserRole.DELIVERY_PARTNER]: "DRIVER",
  [UserRole.ADMIN]: "ADMIN",
};

// The only transitions a RESTAURANT_OWNER may drive directly. PAYMENT_PENDING
// has no entry (a restaurant never acts on an unpaid order) and
// ASSIGNED/PICKED_UP/ON_THE_WAY/DELIVERED are deliberately absent as
// "from" states — once dispatched, only the driver/system may advance it
// further.
const RESTAURANT_ALLOWED_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.PLACED]: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
  [OrderStatus.ACCEPTED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY_FOR_PICKUP, OrderStatus.CANCELLED],
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity) private readonly orders: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity)
    private readonly orderItems: Repository<OrderItemEntity>,
    @InjectRepository(PaymentEntity) private readonly payments: Repository<PaymentEntity>,
    @InjectRepository(DishEntity) private readonly dishes: Repository<DishEntity>,
    @InjectRepository(RestaurantEntity)
    private readonly restaurants: Repository<RestaurantEntity>,
    @InjectRepository(CouponEntity) private readonly coupons: Repository<CouponEntity>,
    private readonly realtime: RealtimeEmitterService,
    private readonly paymentsService: PaymentsService,
    private readonly restaurantsService: RestaurantsService,
    private readonly orderHistory: OrderHistoryService,
    @Inject(forwardRef(() => DeliveryService))
    private readonly delivery: DeliveryService,
  ) {}

  async checkout(customerId: string, input: CheckoutInput) {
    const restaurant = await this.restaurants.findOne({
      where: { id: input.restaurantId },
    });
    if (!restaurant) throw new NotFoundException("Restaurant not found");
    // Previously unchecked entirely — a customer could place an order
    // against a CLOSED/PAUSED restaurant (or one mid-holiday) as long as its
    // id and dishes were still valid. isOpenNow is the same function the
    // customer-facing "why is this closed" banner reads, so the two can
    // never disagree.
    const availability = await this.restaurantsService.isOpenNow(restaurant);
    if (!availability.open) {
      throw new BadRequestException(
        `${restaurant.name} isn't accepting orders right now${availability.reason ? ` (${availability.reason})` : ""}.`,
      );
    }

    let itemTotal = 0;
    const itemsToSave: Partial<OrderItemEntity>[] = [];
    for (const cartItem of input.items) {
      const dish = await this.dishes.findOne({ where: { id: cartItem.dishId } });
      if (!dish || !dish.isInStock) {
        throw new BadRequestException(`Dish unavailable: ${cartItem.name}`);
      }
      // Customer pays customerPrice when configured (admin markup); otherwise
      // behavior is unchanged from before this field existed. Never derived from
      // client input — always read fresh from the DB.
      const unitPrice = dish.customerPrice ?? dish.discountPrice ?? dish.price;
      const addonsTotal = cartItem.addons.reduce((sum, a) => sum + a.price, 0);
      const lineTotal = (unitPrice + addonsTotal) * cartItem.quantity;
      itemTotal += lineTotal;
      itemsToSave.push({
        dishId: dish.id,
        nameSnapshot: dish.name,
        unitPriceSnapshot: unitPrice,
        restaurantPriceSnapshot: dish.price,
        quantity: cartItem.quantity,
        addons: cartItem.addons,
      });
    }

    // Coupon validity + discount are computed here regardless of payment method.
    // Usage-count incrementing, however, only happens once payment is confirmed for
    // online methods (see below) — otherwise a customer could burn a single-use
    // coupon by repeatedly abandoning payment. COD keeps incrementing immediately,
    // matching its existing (unchanged) behavior.
    let discountAmount = 0;
    let couponId: string | undefined;
    if (input.couponCode) {
      const coupon = await this.coupons.findOne({
        where: { code: input.couponCode.toUpperCase() },
      });
      const now = new Date();
      const underPerUserLimit =
        !coupon?.perUserLimit ||
        (await this.orders.count({ where: { couponId: coupon.id, customerId } })) <
          coupon.perUserLimit;
      if (
        coupon &&
        coupon.isActive &&
        itemTotal >= coupon.minOrderValue &&
        (!coupon.startsAt || new Date(coupon.startsAt) <= now) &&
        new Date(coupon.expiresAt) > now &&
        (!coupon.usageLimit || coupon.timesUsed < coupon.usageLimit) &&
        underPerUserLimit
      ) {
        couponId = coupon.id;
        if (coupon.type === CouponType.PERCENTAGE) {
          discountAmount = (itemTotal * coupon.value) / 100;
          if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
        } else if (coupon.type === CouponType.FLAT) {
          discountAmount = coupon.value;
        }
      }
    }

    const deliveryFee = itemTotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE_BASE;
    const taxAmount = Math.round(itemTotal * GST_RATE * 100) / 100;
    const grandTotal =
      itemTotal +
      deliveryFee +
      PACKAGING_FEE +
      PLATFORM_FEE +
      taxAmount +
      input.tipAmount -
      discountAmount;

    if (input.paymentMethod === PaymentMethod.COD) {
      const order = await this.orders.save(
        this.orders.create({
          customerId,
          restaurantId: input.restaurantId,
          addressId: input.addressId,
          couponId,
          status: OrderStatus.PLACED,
          itemTotal,
          deliveryFee,
          packagingFee: PACKAGING_FEE,
          platformFee: PLATFORM_FEE,
          taxAmount,
          discountAmount,
          tipAmount: input.tipAmount,
          grandTotal,
          paymentMethod: input.paymentMethod,
          specialInstructions: input.specialInstructions,
        }),
      );

      await this.orderItems.save(
        itemsToSave.map((item) => this.orderItems.create({ ...item, orderId: order.id })),
      );

      await this.payments.save(
        this.payments.create({
          orderId: order.id,
          method: input.paymentMethod,
          status: PaymentStatus.SUCCEEDED,
          amount: grandTotal,
          simulatedTxnRef: `SIM-${uuid().slice(0, 8).toUpperCase()}`,
        }),
      );

      if (couponId) {
        await this.coupons.increment({ id: couponId }, "timesUsed", 1);
      }

      await this.orderHistory.record(order.id, OrderStatus.PLACED, "CUSTOMER", customerId, "Order placed (Cash on Delivery)");

      const full = await this.get(order.id);
      this.realtime.orderCreated(full);
      return full;
    }

    // Non-COD: create the Razorpay order FIRST, before any DB write. If this throws
    // (no credentials configured, Razorpay API error), checkout aborts cleanly with
    // zero DB rows created and the client's cart untouched.
    const orderId = uuid();
    const amountPaise = Math.round(grandTotal * 100);
    const razorpay = await this.paymentsService.createRazorpayOrder(amountPaise, orderId);

    const savedOrder = await this.orders.manager.transaction(async (manager) => {
      const orderRepo = manager.getRepository(OrderEntity);
      const itemRepo = manager.getRepository(OrderItemEntity);
      const paymentRepo = manager.getRepository(PaymentEntity);

      const newOrder = await orderRepo.save(
        orderRepo.create({
          id: orderId,
          customerId,
          restaurantId: input.restaurantId,
          addressId: input.addressId,
          couponId,
          status: OrderStatus.PAYMENT_PENDING,
          itemTotal,
          deliveryFee,
          packagingFee: PACKAGING_FEE,
          platformFee: PLATFORM_FEE,
          taxAmount,
          discountAmount,
          tipAmount: input.tipAmount,
          grandTotal,
          paymentMethod: input.paymentMethod,
          specialInstructions: input.specialInstructions,
        }),
      );

      await itemRepo.save(
        itemsToSave.map((item) => itemRepo.create({ ...item, orderId: newOrder.id })),
      );

      await paymentRepo.save(
        paymentRepo.create({
          orderId: newOrder.id,
          method: input.paymentMethod,
          status: PaymentStatus.PENDING,
          amount: grandTotal,
          amountPaise,
          razorpayOrderId: razorpay.razorpayOrderId,
        }),
      );

      return newOrder;
    });

    await this.orderHistory.record(
      savedOrder.id,
      OrderStatus.PAYMENT_PENDING,
      "CUSTOMER",
      customerId,
      "Order created, awaiting online payment",
    );

    // orderCreated is intentionally NOT emitted here — the restaurant/KDS/admin only
    // learn this order exists once PaymentsService confirms payment succeeded.
    const full = await this.get(savedOrder.id);
    return {
      ...full,
      payment: {
        razorpayOrderId: razorpay.razorpayOrderId,
        keyId: razorpay.keyId,
        amountPaise: razorpay.amountPaise,
        currency: razorpay.currency,
      },
    };
  }

  async get(id: string) {
    const order = await this.orders.findOne({ where: { id } });
    if (!order) throw new NotFoundException("Order not found");
    const items = await this.orderItems.find({ where: { orderId: id } });
    return { ...order, items };
  }

  async listForCustomer(customerId: string) {
    return this.orders.find({ where: { customerId }, order: { createdAt: "DESC" } });
  }

  async listForRestaurant(restaurantId: string) {
    // Excludes PAYMENT_PENDING: a restaurant must never see an order that hasn't
    // been paid for yet, on refresh or realtime alike.
    return this.orders
      .createQueryBuilder("o")
      .where("o.restaurantId = :restaurantId", { restaurantId })
      .andWhere("o.status != :pending", { pending: OrderStatus.PAYMENT_PENDING })
      .orderBy("o.createdAt", "DESC")
      .getMany();
  }

  async listAll() {
    return this.orders.find({ order: { createdAt: "DESC" }, take: 200 });
  }

  async updateStatus(
    id: string,
    actor: { userId: string; role: UserRole },
    status: OrderStatus,
    reason?: string,
  ) {
    const order = await this.orders.findOne({ where: { id } });
    if (!order) throw new NotFoundException("Order not found");

    const restaurant = await this.restaurants.findOne({ where: { id: order.restaurantId } });
    if (actor.role === UserRole.RESTAURANT_OWNER) {
      if (restaurant?.ownerId !== actor.userId) {
        throw new ForbiddenException("Not your restaurant's order");
      }
      // Previously any status was accepted from a restaurant owner with no
      // check at all — they could PATCH an order straight from PLACED to
      // DELIVERED, skipping ACCEPTED/PREPARING/READY_FOR_PICKUP and the
      // entire driver/OTP flow those stages gate. ASSIGNED/PICKED_UP/
      // ON_THE_WAY/DELIVERED are driver- and system-controlled (via
      // DeliveryService.advanceStage -> setStatusInternal) and must never be
      // settable directly by the restaurant. Admin keeps override access for
      // support/ops corrections.
      const allowedNext = RESTAURANT_ALLOWED_TRANSITIONS[order.status] ?? [];
      if (!allowedNext.includes(status)) {
        throw new BadRequestException(
          `Cannot move an order from ${order.status} to ${status}`,
        );
      }
    }

    await this.orders.update(id, {
      status,
      ...(status === OrderStatus.CANCELLED ? { cancelledReason: reason } : {}),
    });
    const full = await this.get(id);
    this.realtime.orderStatusChanged(full);
    this.realtime.kitchenTicketUpdate(order.restaurantId, full);

    await this.orderHistory.record(
      id,
      status,
      ROLE_TO_ACTOR_TYPE[actor.role],
      actor.userId,
      status === OrderStatus.CANCELLED ? reason : undefined,
    );

    if (status === OrderStatus.READY_FOR_PICKUP) {
      await this.delivery.createOfferForOrder(full);
    }
    return full;
  }

  // Called internally by DeliveryService as the driver advances stages
  // (ASSIGNED/PICKED_UP/ON_THE_WAY/DELIVERED) — actor is always the driver
  // whose action triggered the transition.
  async setStatusInternal(id: string, status: OrderStatus, driverId?: string) {
    await this.orders.update(id, { status });
    const full = await this.get(id);
    this.realtime.orderStatusChanged(full);
    await this.orderHistory.record(id, status, driverId ? "DRIVER" : "SYSTEM", driverId);
    return full;
  }

  async cancel(id: string, actor: { userId: string; role: UserRole }, reason?: string) {
    const order = await this.orders.findOne({ where: { id } });
    if (!order) throw new NotFoundException("Order not found");
    if (order.customerId !== actor.userId && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Not your order");
    }
    return this.updateStatus(id, actor, OrderStatus.CANCELLED, reason);
  }
}
