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
    @Inject(forwardRef(() => DeliveryService))
    private readonly delivery: DeliveryService,
  ) {}

  async checkout(customerId: string, input: CheckoutInput) {
    const restaurant = await this.restaurants.findOne({
      where: { id: input.restaurantId },
    });
    if (!restaurant) throw new NotFoundException("Restaurant not found");

    let itemTotal = 0;
    const itemsToSave: Partial<OrderItemEntity>[] = [];
    for (const cartItem of input.items) {
      const dish = await this.dishes.findOne({ where: { id: cartItem.dishId } });
      if (!dish || !dish.isInStock) {
        throw new BadRequestException(`Dish unavailable: ${cartItem.name}`);
      }
      const unitPrice = dish.discountPrice ?? dish.price;
      const addonsTotal = cartItem.addons.reduce((sum, a) => sum + a.price, 0);
      const lineTotal = (unitPrice + addonsTotal) * cartItem.quantity;
      itemTotal += lineTotal;
      itemsToSave.push({
        dishId: dish.id,
        nameSnapshot: dish.name,
        unitPriceSnapshot: unitPrice,
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
      if (
        coupon &&
        coupon.isActive &&
        itemTotal >= coupon.minOrderValue &&
        new Date(coupon.expiresAt) > new Date() &&
        (!coupon.usageLimit || coupon.timesUsed < coupon.usageLimit)
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
    if (
      actor.role === UserRole.RESTAURANT_OWNER &&
      restaurant?.ownerId !== actor.userId
    ) {
      throw new ForbiddenException("Not your restaurant's order");
    }

    await this.orders.update(id, {
      status,
      ...(status === OrderStatus.CANCELLED ? { cancelledReason: reason } : {}),
    });
    const full = await this.get(id);
    this.realtime.orderStatusChanged(full);
    this.realtime.kitchenTicketUpdate(order.restaurantId, full);

    if (status === OrderStatus.READY_FOR_PICKUP) {
      await this.delivery.createOfferForOrder(full);
    }
    return full;
  }

  // Called internally by DeliveryService as the driver advances stages.
  async setStatusInternal(id: string, status: OrderStatus) {
    await this.orders.update(id, { status });
    const full = await this.get(id);
    this.realtime.orderStatusChanged(full);
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
