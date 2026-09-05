import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import {
  OrderStatus,
  RefundStatus,
  RestaurantStatus,
  UserRole,
  WithdrawalOwnerType,
  WithdrawalStatus,
} from "@quickbite/types";
import {
  AuditLogEntity,
  CouponEntity,
  DeliveryEntity,
  DriverProfileEntity,
  OrderEntity,
  OrderItemEntity,
  OrderStatusHistoryEntity,
  PaymentEntity,
  RefundEntity,
  ReviewEntity,
  RestaurantEntity,
  UserEntity,
  WithdrawalRequestEntity,
} from "../../database/entities";
import { OrderHistoryService } from "../order-history/order-history.service";
import { RefundsService } from "../refunds/refunds.service";

// Every order that has actually been placed and paid for — excludes
// PAYMENT_PENDING (an abandoned/never-completed Razorpay checkout has no
// business counting toward revenue or order totals anywhere in this file).
const PLACED_OR_LATER = [
  OrderStatus.PLACED,
  OrderStatus.ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.ASSIGNED,
  OrderStatus.PICKED_UP,
  OrderStatus.ON_THE_WAY,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
];
const ACTIVE_ORDER_STATUSES = PLACED_OR_LATER.filter(
  (s) => s !== OrderStatus.DELIVERED && s !== OrderStatus.CANCELLED,
);

// SQL-side date-window fragments only — this codebase has a known bug where a
// Postgres `timestamp without time zone` column (BaseEntity.createdAt), read
// back through node-postgres/TypeORM on this non-UTC host, silently applies
// the wrong offset if it's ever parsed into a JS Date and compared in JS. The
// fix used everywhere else in this app is a dedicated ISO-string column
// compared in JS — but `orders.createdAt` has no such column, so instead
// every date-range filter here stays entirely inside Postgres (now()/interval
// arithmetic, or an explicit ::date cast of a plain string param), and the
// resulting value is never round-tripped through `new Date(...)`.
const RANGE_SQL: Record<string, string> = {
  today: `o."createdAt" >= date_trunc('day', now())`,
  "7d": `o."createdAt" >= now() - interval '7 days'`,
  "30d": `o."createdAt" >= now() - interval '30 days'`,
  month: `o."createdAt" >= date_trunc('month', now())`,
};

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(RestaurantEntity)
    private readonly restaurants: Repository<RestaurantEntity>,
    @InjectRepository(OrderEntity) private readonly orders: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity) private readonly orderItems: Repository<OrderItemEntity>,
    @InjectRepository(PaymentEntity) private readonly payments: Repository<PaymentEntity>,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(DriverProfileEntity)
    private readonly drivers: Repository<DriverProfileEntity>,
    @InjectRepository(AuditLogEntity)
    private readonly auditLogs: Repository<AuditLogEntity>,
    @InjectRepository(DeliveryEntity)
    private readonly deliveries: Repository<DeliveryEntity>,
    @InjectRepository(RefundEntity) private readonly refundsRepo: Repository<RefundEntity>,
    @InjectRepository(ReviewEntity) private readonly reviews: Repository<ReviewEntity>,
    @InjectRepository(CouponEntity) private readonly coupons: Repository<CouponEntity>,
    @InjectRepository(WithdrawalRequestEntity)
    private readonly withdrawals: Repository<WithdrawalRequestEntity>,
    @InjectRepository(OrderStatusHistoryEntity)
    private readonly orderHistoryRepo: Repository<OrderStatusHistoryEntity>,
    private readonly orderHistory: OrderHistoryService,
    private readonly refunds: RefundsService,
  ) {}

  // ── Section 1/2: Dashboard + Revenue Analytics ──────────────────────────

  async dashboard() {
    const [
      totalOrders,
      todayOrders,
      activeOrders,
      completedOrders,
      cancelledOrders,
      totalCustomers,
      activeRestaurants,
      onlineDrivers,
    ] = await Promise.all([
      this.orders.count(),
      this.orders.createQueryBuilder("o").where(RANGE_SQL.today).getCount(),
      this.orders
        .createQueryBuilder("o")
        .where("o.status IN (:...statuses)", { statuses: ACTIVE_ORDER_STATUSES })
        .getCount(),
      this.orders.count({ where: { status: OrderStatus.DELIVERED } }),
      this.orders.count({ where: { status: OrderStatus.CANCELLED } }),
      this.users.count({ where: { role: UserRole.CUSTOMER } }),
      this.restaurants.count({ where: { status: RestaurantStatus.ACTIVE } }),
      this.drivers.count({ where: { isOnline: true } }),
    ]);

    const totalRevenueRow = await this.orders
      .createQueryBuilder("o")
      .select("COALESCE(SUM(o.grandTotal), 0)", "total")
      .where("o.status IN (:...statuses)", { statuses: PLACED_OR_LATER })
      .getRawOne<{ total: string }>();
    const totalRevenue = totalRevenueRow?.total ?? "0";

    const todayRevenueRow = await this.orders
      .createQueryBuilder("o")
      .select("COALESCE(SUM(o.grandTotal), 0)", "total")
      .where("o.status IN (:...statuses)", { statuses: PLACED_OR_LATER })
      .andWhere(RANGE_SQL.today)
      .getRawOne<{ total: string }>();
    const todayRevenue = todayRevenueRow?.total ?? "0";

    // Platform's own revenue: the explicit per-order platformFee line item
    // plus the restaurant commission cut, both only for orders that actually
    // completed — never counted on an order still in flight or cancelled —
    // minus whatever has genuinely been refunded back out.
    const commissionRow = await this.orders
      .createQueryBuilder("o")
      .innerJoin(RestaurantEntity, "r", "r.id::text = o.restaurantId")
      .select("COALESCE(SUM(o.itemTotal * r.commissionRate), 0)", "commission")
      .addSelect("COALESCE(SUM(o.platformFee), 0)", "platformFee")
      .where("o.status = :delivered", { delivered: OrderStatus.DELIVERED })
      .getRawOne<{ commission: string; platformFee: string }>();
    const commission = commissionRow?.commission ?? "0";
    const platformFee = commissionRow?.platformFee ?? "0";

    const refundedAmount = await this.refunds.totalRefundedAmount();
    const platformRevenue = Number(commission) + Number(platformFee) - refundedAmount;

    const refundedOrdersCount = await this.refundsRepo
      .createQueryBuilder("r")
      .select("COUNT(DISTINCT r.orderId)", "count")
      .where("r.status = :status", { status: RefundStatus.REFUNDED })
      .getRawOne<{ count: string }>()
      .then((r) => Number(r?.count ?? 0));

    const restaurantGrossPayableRow = await this.orders
      .createQueryBuilder("o")
      .innerJoin(RestaurantEntity, "r", "r.id::text = o.restaurantId")
      .select("COALESCE(SUM(o.itemTotal * (1 - r.commissionRate)), 0)", "payable")
      .where("o.status = :delivered", { delivered: OrderStatus.DELIVERED })
      .getRawOne<{ payable: string }>();
    const restaurantGrossPayable = restaurantGrossPayableRow?.payable ?? "0";

    const driverGrossPayableRow = await this.deliveries
      .createQueryBuilder("d")
      .select("COALESCE(SUM(d.basePay + d.distancePay + d.surgeBonus + d.tip), 0)", "total")
      .where("d.stage = :delivered", { delivered: "DELIVERED" })
      .getRawOne<{ total: string }>();
    const driverGrossPayable = driverGrossPayableRow?.total ?? "0";

    const paidOutByOwnerType = async (ownerType: WithdrawalOwnerType) => {
      const row = await this.withdrawals
        .createQueryBuilder("w")
        .select("COALESCE(SUM(w.amount), 0)", "total")
        .where("w.ownerType = :ownerType AND w.status = :status", {
          ownerType,
          status: WithdrawalStatus.COMPLETED,
        })
        .getRawOne<{ total: string }>();
      return Number(row?.total ?? 0);
    };
    const pendingByOwnerType = async (ownerType: WithdrawalOwnerType) => {
      const row = await this.withdrawals
        .createQueryBuilder("w")
        .select("COALESCE(SUM(w.amount), 0)", "total")
        .where("w.ownerType = :ownerType AND w.status IN (:...statuses)", {
          ownerType,
          statuses: [WithdrawalStatus.PENDING, WithdrawalStatus.PROCESSING],
        })
        .getRawOne<{ total: string }>();
      return Number(row?.total ?? 0);
    };

    const [restaurantPaidOut, driverPaidOut, pendingSettlements, pendingDriverPayouts] =
      await Promise.all([
        paidOutByOwnerType(WithdrawalOwnerType.RESTAURANT),
        paidOutByOwnerType(WithdrawalOwnerType.DRIVER),
        pendingByOwnerType(WithdrawalOwnerType.RESTAURANT),
        pendingByOwnerType(WithdrawalOwnerType.DRIVER),
      ]);

    return {
      kpis: {
        totalRevenue: Number(totalRevenue),
        todayRevenue: Number(todayRevenue),
        totalOrders,
        todayOrders,
        activeOrders,
        completedOrders,
        cancelledOrders,
        refundedOrders: refundedOrdersCount,
        totalCustomers,
        activeRestaurants,
        onlineDrivers,
      },
      financials: {
        restaurantPayable: Math.max(0, Number(restaurantGrossPayable) - restaurantPaidOut),
        driverPayable: Math.max(0, Number(driverGrossPayable) - driverPaidOut),
        platformRevenue,
        pendingSettlements,
        pendingDriverPayouts,
        refundAmount: refundedAmount,
      },
    };
  }

  async revenueAnalytics(range: "today" | "7d" | "30d" | "month" | "custom", from?: string, to?: string) {
    const qb = this.orders
      .createQueryBuilder("o")
      .innerJoin(RestaurantEntity, "r", "r.id::text = o.restaurantId")
      .where("o.status = :delivered", { delivered: OrderStatus.DELIVERED });

    if (range === "custom" && from && to) {
      // from/to are plain "YYYY-MM-DD" strings handed to Postgres for it to
      // cast itself — never a JS Date object bound as the parameter, which is
      // exactly the pattern that triggers the timezone-misread bug above.
      qb.andWhere(`o."createdAt" >= :from::date AND o."createdAt" < (:to::date + interval '1 day')`, {
        from,
        to,
      });
    } else {
      qb.andWhere(RANGE_SQL[range] ?? RANGE_SQL["30d"]);
    }

    const rows = await qb
      .select(`to_char(o."createdAt", 'YYYY-MM-DD')`, "day")
      .addSelect("COALESCE(SUM(o.grandTotal), 0)", "revenue")
      .addSelect("COUNT(*)", "orders")
      .addSelect("COALESCE(SUM(o.itemTotal * r.commissionRate), 0)", "commission")
      .addSelect("COALESCE(SUM(o.itemTotal * (1 - r.commissionRate)), 0)", "restaurantEarnings")
      .addSelect("COALESCE(SUM(o.deliveryFee), 0)", "deliveryFees")
      .groupBy("day")
      .orderBy("day", "ASC")
      .getRawMany<{
        day: string;
        revenue: string;
        orders: string;
        commission: string;
        restaurantEarnings: string;
        deliveryFees: string;
      }>();

    const series = rows.map((r) => ({
      day: r.day,
      revenue: Number(r.revenue),
      orders: Number(r.orders),
      commission: Number(r.commission),
      restaurantEarnings: Number(r.restaurantEarnings),
      deliveryFees: Number(r.deliveryFees),
    }));

    const refundedInRange = await (async () => {
      const rqb = this.refundsRepo
        .createQueryBuilder("rf")
        .select("COALESCE(SUM(rf.refundAmount), 0)", "total")
        .where("rf.status = :status", { status: RefundStatus.REFUNDED });
      if (range === "custom" && from && to) {
        rqb.andWhere(`rf."requestedAt" >= :from AND rf."requestedAt" < :to`, {
          from,
          to: `${to}T23:59:59.999Z`,
        });
      }
      const row = await rqb.getRawOne<{ total: string }>();
      return Number(row?.total ?? 0);
    })();

    const gross = series.reduce((s, r) => s + r.revenue, 0);
    const commission = series.reduce((s, r) => s + r.commission, 0);
    const restaurantShare = series.reduce((s, r) => s + r.restaurantEarnings, 0);
    const deliveryFees = series.reduce((s, r) => s + r.deliveryFees, 0);

    return {
      series,
      breakdown: {
        grossOrderValue: gross,
        platformCommission: commission,
        restaurantShare,
        driverDeliveryFees: deliveryFees,
        refunds: refundedInRange,
        netPlatformRevenue: commission - refundedInRange,
      },
    };
  }

  // ── Section 3/4/5: Orders, Order Detail, Transition History ────────────

  async listOrdersFiltered(params: {
    status?: string;
    search?: string;
    sortBy?: "newest" | "oldest" | "highest" | "lowest";
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));

    const qb = this.orders
      .createQueryBuilder("o")
      .leftJoin(RestaurantEntity, "r", "r.id::text = o.restaurantId")
      .leftJoin(UserEntity, "c", "c.id::text = o.customerId")
      .leftJoin(DeliveryEntity, "d", "d.orderId = o.id::text")
      .leftJoin(UserEntity, "dv", "dv.id::text = d.driverId")
      .select([
        "o.id AS id",
        "o.status AS status",
        "o.grandTotal AS \"grandTotal\"",
        "o.createdAt AS \"createdAt\"",
        "o.restaurantId AS \"restaurantId\"",
        "o.customerId AS \"customerId\"",
        "r.name AS \"restaurantName\"",
        "c.name AS \"customerName\"",
        "d.driverId AS \"driverId\"",
        "dv.name AS \"driverName\"",
      ]);

    if (params.status && params.status !== "ALL") {
      qb.andWhere("o.status = :status", { status: params.status });
    }
    if (params.search) {
      qb.andWhere(
        `(CAST(o.id AS TEXT) ILIKE :s OR c.name ILIKE :s OR c.email ILIKE :s OR r.name ILIKE :s OR dv.name ILIKE :s)`,
        { s: `%${params.search}%` },
      );
    }
    switch (params.sortBy) {
      case "oldest":
        qb.orderBy("o.createdAt", "ASC");
        break;
      case "highest":
        qb.orderBy("o.grandTotal", "DESC");
        break;
      case "lowest":
        qb.orderBy("o.grandTotal", "ASC");
        break;
      default:
        qb.orderBy("o.createdAt", "DESC");
    }

    const total = await qb.getCount();
    const rows = await qb
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .getRawMany();

    return { rows, total, page, pageSize };
  }

  async getOrderDetail(id: string) {
    const order = await this.orders.findOne({ where: { id } });
    if (!order) throw new NotFoundException("Order not found");

    const [items, customer, restaurant, payment, delivery, refundRows, history] =
      await Promise.all([
        this.orderItems.find({ where: { orderId: id } }),
        this.users.findOne({ where: { id: order.customerId } }),
        this.restaurants.findOne({ where: { id: order.restaurantId } }),
        this.payments.findOne({ where: { orderId: id } }),
        this.deliveries.findOne({ where: { orderId: id } }),
        this.refundsRepo.find({ where: { orderId: id }, order: { createdAt: "DESC" } }),
        this.orderHistory.forOrder(id),
      ]);

    let driver: UserEntity | null = null;
    let driverProfile: DriverProfileEntity | null = null;
    if (delivery?.driverId) {
      [driver, driverProfile] = await Promise.all([
        this.users.findOne({ where: { id: delivery.driverId } }),
        this.drivers.findOne({ where: { userId: delivery.driverId } }),
      ]);
    }

    const commissionRate = restaurant?.commissionRate ?? 0;
    const platformCommission = order.itemTotal * commissionRate;
    const restaurantSettlement = order.itemTotal - platformCommission;
    const driverEarning = delivery
      ? delivery.basePay + delivery.distancePay + delivery.surgeBonus + delivery.tip
      : 0;

    // Refund lifecycle events, merged into the same chronological timeline as
    // real OrderStatusHistory rows — built from the refund's own real
    // requestedAt/processedAt timestamps (never fabricated), just relabeled
    // as timeline entries rather than stored as fake OrderStatus rows (which
    // has no REFUND_* value in its enum and shouldn't gain one just for
    // display purposes).
    type TimelineEvent = {
      status: string;
      actorType: string;
      actorId?: string;
      note?: string;
      occurredAt: string;
    };
    const refundTimelineEvents = refundRows.flatMap((r): TimelineEvent[] => {
      const events: TimelineEvent[] = [
        {
          status: "REFUND_REQUESTED",
          actorType: r.requestedByRole === UserRole.ADMIN ? "ADMIN" : "CUSTOMER",
          actorId: r.requestedByUserId,
          note: r.reason,
          occurredAt: r.requestedAt,
        },
      ];
      if (r.processedAt) {
        events.push({
          status: `REFUND_${r.status}`,
          actorType: "ADMIN",
          actorId: r.processedByAdminId,
          note: r.adminNote,
          occurredAt: r.processedAt,
        });
      }
      return events;
    });

    const timeline = [...history, ...refundTimelineEvents].sort(
      (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
    );

    return {
      order,
      items,
      customer: customer ? this.sanitizeUser(customer) : null,
      restaurant,
      driver: driver ? this.sanitizeUser(driver) : null,
      driverProfile,
      delivery: delivery ? this.redactOtps(delivery) : null,
      payment,
      refunds: refundRows,
      timeline,
      priceBreakdown: {
        itemTotal: order.itemTotal,
        deliveryFee: order.deliveryFee,
        packagingFee: order.packagingFee,
        platformFee: order.platformFee,
        taxAmount: order.taxAmount,
        discountAmount: order.discountAmount,
        tipAmount: order.tipAmount,
        grandTotal: order.grandTotal,
        platformCommission,
        restaurantSettlement,
        driverEarning,
        commissionRate,
      },
    };
  }

  private sanitizeUser(u: UserEntity) {
    const { passwordHash: _p, refreshTokenHash: _r, ...safe } = u as any;
    return safe;
  }

  private redactOtps(d: DeliveryEntity) {
    const { pickupOtp: _p, dropOtp: _d, ...safe } = d as any;
    return safe;
  }

  // ── Section 7: Payments ─────────────────────────────────────────────────

  async listPayments(params: { status?: string; search?: string; page?: number; pageSize?: number }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));

    const qb = this.payments
      .createQueryBuilder("p")
      .leftJoin(OrderEntity, "o", "o.id::text = p.orderId")
      .leftJoin(UserEntity, "c", "c.id::text = o.customerId")
      .select([
        "p.id AS id",
        "p.orderId AS \"orderId\"",
        "p.method AS method",
        "p.status AS status",
        "p.amount AS amount",
        "p.razorpayOrderId AS \"razorpayOrderId\"",
        "p.razorpayPaymentId AS \"razorpayPaymentId\"",
        "p.createdAt AS \"createdAt\"",
        "c.name AS \"customerName\"",
        "c.email AS \"customerEmail\"",
      ])
      .orderBy("p.createdAt", "DESC");

    if (params.status && params.status !== "ALL") {
      qb.andWhere("p.status = :status", { status: params.status });
    }
    if (params.search) {
      qb.andWhere(`(CAST(p.orderId AS TEXT) ILIKE :s OR c.name ILIKE :s OR c.email ILIKE :s)`, {
        s: `%${params.search}%`,
      });
    }

    const total = await qb.getCount();
    const rows = await qb
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .getRawMany();
    // razorpayOrderId/razorpayPaymentId are Razorpay's own reference ids, not
    // secrets (the secret key never leaves PaymentsService/env config) — safe
    // to surface here for admin reconciliation.
    return { rows, total, page, pageSize };
  }

  // ── Section 8/9: Restaurants ─────────────────────────────────────────────

  async listRestaurants() {
    const restaurants = await this.restaurants.find({ order: { createdAt: "DESC" } });
    const stats = await this.orders
      .createQueryBuilder("o")
      .select("o.restaurantId", "restaurantId")
      .addSelect("COUNT(*)", "orderCount")
      .addSelect(
        `COALESCE(SUM(CASE WHEN o.status = 'DELIVERED' THEN o.grandTotal ELSE 0 END), 0)`,
        "revenue",
      )
      .groupBy("o.restaurantId")
      .getRawMany<{ restaurantId: string; orderCount: string; revenue: string }>();
    const statsByRestaurant = new Map(stats.map((s) => [s.restaurantId, s]));

    const pendingSettlements = await this.withdrawals
      .createQueryBuilder("w")
      .select("w.ownerId", "ownerId")
      .addSelect("COALESCE(SUM(w.amount), 0)", "pending")
      .where("w.ownerType = :type AND w.status IN (:...statuses)", {
        type: WithdrawalOwnerType.RESTAURANT,
        statuses: [WithdrawalStatus.PENDING, WithdrawalStatus.PROCESSING],
      })
      .groupBy("w.ownerId")
      .getRawMany<{ ownerId: string; pending: string }>();
    const pendingByRestaurant = new Map(pendingSettlements.map((p) => [p.ownerId, Number(p.pending)]));

    return restaurants.map((r) => {
      const s = statsByRestaurant.get(r.id);
      return {
        ...r,
        totalOrders: Number(s?.orderCount ?? 0),
        totalRevenue: Number(s?.revenue ?? 0),
        pendingSettlement: pendingByRestaurant.get(r.id) ?? 0,
      };
    });
  }

  async restaurantDetail(id: string) {
    const restaurant = await this.restaurants.findOne({ where: { id } });
    if (!restaurant) throw new NotFoundException("Restaurant not found");

    const delivered = await this.orders.find({
      where: { restaurantId: id, status: OrderStatus.DELIVERED },
    });
    const grossSales = delivered.reduce((s, o) => s + o.itemTotal, 0);
    const customerCharged = delivered.reduce((s, o) => s + o.grandTotal, 0);
    const commission = grossSales * restaurant.commissionRate;
    const discounts = delivered.reduce((s, o) => s + o.discountAmount, 0);

    const refundedForRestaurant = await this.refundsRepo
      .createQueryBuilder("r")
      .select("COALESCE(SUM(r.refundAmount), 0)", "total")
      .where("r.restaurantId = :id AND r.status = :status", { id, status: RefundStatus.REFUNDED })
      .getRawOne<{ total: string }>();

    const paidSettlements = await this.withdrawals
      .createQueryBuilder("w")
      .select("COALESCE(SUM(w.amount), 0)", "total")
      .where("w.ownerType = :type AND w.ownerId = :id AND w.status = :status", {
        type: WithdrawalOwnerType.RESTAURANT,
        id,
        status: WithdrawalStatus.COMPLETED,
      })
      .getRawOne<{ total: string }>();

    const refundedTotal = Number(refundedForRestaurant?.total ?? 0);
    const paidSettlementsTotal = Number(paidSettlements?.total ?? 0);
    const netEarnings = grossSales - commission - refundedTotal;

    const [allOrders, reviewRows, restaurantCoupons] = await Promise.all([
      this.orders.find({ where: { restaurantId: id }, order: { createdAt: "DESC" }, take: 100 }),
      this.reviews.find({ where: { restaurantId: id }, order: { createdAt: "DESC" }, take: 100 }),
      this.coupons.find({ where: { restaurantId: id } }),
    ]);

    return {
      restaurant,
      finance: {
        totalSales: customerCharged,
        restaurantFoodPrice: grossSales,
        platformCommission: commission,
        discounts,
        refunds: refundedTotal,
        netRestaurantEarnings: netEarnings,
        paidSettlements: paidSettlementsTotal,
        pendingSettlement: Math.max(0, netEarnings - paidSettlementsTotal),
      },
      recentOrders: allOrders,
      reviews: reviewRows,
      coupons: restaurantCoupons,
    };
  }

  async approveRestaurant(id: string, actorId: string) {
    const restaurant = await this.restaurants.findOne({ where: { id } });
    if (!restaurant) throw new NotFoundException("Restaurant not found");
    await this.restaurants.update(id, { status: RestaurantStatus.ACTIVE });
    await this.log(actorId, "restaurant.approved", "restaurant", id);
    return this.restaurants.findOne({ where: { id } });
  }

  async suspendRestaurant(id: string, actorId: string) {
    const restaurant = await this.restaurants.findOne({ where: { id } });
    if (!restaurant) throw new NotFoundException("Restaurant not found");
    await this.restaurants.update(id, { status: RestaurantStatus.SUSPENDED });
    await this.log(actorId, "restaurant.suspended", "restaurant", id);
    return this.restaurants.findOne({ where: { id } });
  }

  // ── Section 10: Drivers ──────────────────────────────────────────────────

  async listDrivers() {
    const profiles = await this.drivers.find();
    const userIds = profiles.map((p) => p.userId);
    const usersById = new Map(
      userIds.length
        ? (await this.users.find({ where: { id: In(userIds) } })).map((u) => [u.id, u])
        : [],
    );

    const tripCounts = await this.deliveries
      .createQueryBuilder("d")
      .select("d.driverId", "driverId")
      .addSelect("COUNT(*)", "trips")
      .where("d.stage = 'DELIVERED'")
      .groupBy("d.driverId")
      .getRawMany<{ driverId: string; trips: string }>();
    const tripsByDriver = new Map(tripCounts.map((t) => [t.driverId, Number(t.trips)]));

    const earnings = await this.deliveries
      .createQueryBuilder("d")
      .select("d.driverId", "driverId")
      .addSelect("COALESCE(SUM(d.basePay + d.distancePay + d.surgeBonus + d.tip), 0)", "total")
      .where("d.stage = 'DELIVERED'")
      .groupBy("d.driverId")
      .getRawMany<{ driverId: string; total: string }>();
    const earningsByDriver = new Map(earnings.map((e) => [e.driverId, Number(e.total)]));

    const paidOut = await this.withdrawals
      .createQueryBuilder("w")
      .select("w.ownerId", "ownerId")
      .addSelect("COALESCE(SUM(w.amount), 0)", "total")
      .where("w.ownerType = :type AND w.status = :status", {
        type: WithdrawalOwnerType.DRIVER,
        status: WithdrawalStatus.COMPLETED,
      })
      .groupBy("w.ownerId")
      .getRawMany<{ ownerId: string; total: string }>();
    const paidOutByDriver = new Map(paidOut.map((p) => [p.ownerId, Number(p.total)]));

    // Active-delivery lookup, one query instead of N — keyed by driverId.
    const activeDeliveries = await this.deliveries
      .createQueryBuilder("d")
      .where("d.stage != 'DELIVERED' AND d.driverId IS NOT NULL")
      .getMany();
    const activeByDriver = new Map(activeDeliveries.map((d) => [d.driverId as string, d.orderId]));

    return profiles.map((p) => {
      const user = usersById.get(p.userId);
      const totalEarnings = earningsByDriver.get(p.userId) ?? 0;
      const paid = paidOutByDriver.get(p.userId) ?? 0;
      return {
        ...p,
        name: user?.name ?? null,
        email: user?.email ?? null,
        phone: user?.phone ?? null,
        isActive: user?.isActive ?? true,
        trips: tripsByDriver.get(p.userId) ?? 0,
        totalEarnings,
        pendingPayout: Math.max(0, totalEarnings - paid),
        currentDeliveryOrderId: activeByDriver.get(p.userId) ?? null,
      };
    });
  }

  async driverDetail(userId: string) {
    const profile = await this.drivers.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException("Driver not found");
    const user = await this.users.findOne({ where: { id: userId } });

    const [deliveries, withdrawalHistory, reviewRows] = await Promise.all([
      this.deliveries.find({ where: { driverId: userId }, order: { createdAt: "DESC" }, take: 100 }),
      this.withdrawals.find({
        where: { ownerType: WithdrawalOwnerType.DRIVER, ownerId: userId },
        order: { createdAt: "DESC" },
      }),
      this.reviews.find({ where: { driverId: userId }, order: { createdAt: "DESC" }, take: 50 }),
    ]);

    const delivered = deliveries.filter((d) => d.stage === "DELIVERED");
    const totalEarnings = delivered.reduce(
      (s, d) => s + d.basePay + d.distancePay + d.surgeBonus + d.tip,
      0,
    );
    const paidOut = withdrawalHistory
      .filter((w) => w.status === WithdrawalStatus.COMPLETED)
      .reduce((s, w) => s + w.amount, 0);

    return {
      profile,
      user: user ? this.sanitizeUser(user) : null,
      tripHistory: deliveries.map((d) => this.redactOtps(d)),
      earnings: {
        totalEarnings,
        pendingPayout: Math.max(0, totalEarnings - paidOut),
      },
      payouts: withdrawalHistory,
      reviews: reviewRows,
    };
  }

  // ── Section 11: Customers ────────────────────────────────────────────────

  async listCustomers() {
    const customers = await this.users.find({ where: { role: UserRole.CUSTOMER } });
    const customerIds = customers.map((c) => c.id);
    if (!customerIds.length) return [];

    const orderStats = await this.orders
      .createQueryBuilder("o")
      .select("o.customerId", "customerId")
      .addSelect("COUNT(*)", "totalOrders")
      .addSelect(`COUNT(*) FILTER (WHERE o.status = 'DELIVERED')`, "completed")
      .addSelect(`COUNT(*) FILTER (WHERE o.status = 'CANCELLED')`, "cancelled")
      .addSelect(
        `COALESCE(SUM(CASE WHEN o.status = 'DELIVERED' THEN o.grandTotal ELSE 0 END), 0)`,
        "totalSpent",
      )
      .where("o.customerId IN (:...ids)", { ids: customerIds })
      .groupBy("o.customerId")
      .getRawMany<{
        customerId: string;
        totalOrders: string;
        completed: string;
        cancelled: string;
        totalSpent: string;
      }>();
    const statsByCustomer = new Map(orderStats.map((s) => [s.customerId, s]));

    const refundStats = await this.refundsRepo
      .createQueryBuilder("r")
      .select("r.customerId", "customerId")
      .addSelect("COALESCE(SUM(r.refundAmount), 0)", "total")
      .where("r.customerId IN (:...ids) AND r.status = :status", { ids: customerIds, status: RefundStatus.REFUNDED })
      .groupBy("r.customerId")
      .getRawMany<{ customerId: string; total: string }>();
    const refundsByCustomer = new Map(refundStats.map((r) => [r.customerId, Number(r.total)]));

    return customers.map((c) => {
      const s = statsByCustomer.get(c.id);
      return {
        ...this.sanitizeUser(c),
        totalOrders: Number(s?.totalOrders ?? 0),
        completedOrders: Number(s?.completed ?? 0),
        cancelledOrders: Number(s?.cancelled ?? 0),
        totalSpent: Number(s?.totalSpent ?? 0),
        totalRefunds: refundsByCustomer.get(c.id) ?? 0,
      };
    });
  }

  async customerDetail(id: string) {
    const customer = await this.users.findOne({ where: { id, role: UserRole.CUSTOMER } });
    if (!customer) throw new NotFoundException("Customer not found");

    const [orders, paymentRows, refundRows, reviewRows] = await Promise.all([
      this.orders.find({ where: { customerId: id }, order: { createdAt: "DESC" }, take: 200 }),
      this.payments
        .createQueryBuilder("p")
        .innerJoin(OrderEntity, "o", "o.id::text = p.orderId")
        .where("o.customerId = :id", { id })
        .orderBy("p.createdAt", "DESC")
        .getMany(),
      this.refundsRepo.find({ where: { customerId: id }, order: { createdAt: "DESC" } }),
      this.reviews.find({ where: { authorId: id }, order: { createdAt: "DESC" } }),
    ]);

    return {
      customer: this.sanitizeUser(customer),
      orderHistory: orders,
      paymentHistory: paymentRows,
      refundHistory: refundRows,
      reviews: reviewRows,
    };
  }

  // ── Section 8/10/11: generic account suspension ─────────────────────────

  async suspendUser(id: string, actorId: string) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException("Cannot suspend an admin account");
    }
    await this.users.update(id, { isActive: false });
    await this.log(actorId, `${user.role}.suspended`, "user", id);
    return this.users.findOne({ where: { id } }).then((u) => (u ? this.sanitizeUser(u) : u));
  }

  async activateUser(id: string, actorId: string) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    await this.users.update(id, { isActive: true });
    await this.log(actorId, `${user.role}.activated`, "user", id);
    return this.users.findOne({ where: { id } }).then((u) => (u ? this.sanitizeUser(u) : u));
  }

  // ── Section 14 note: category/dish admin management already reuses
  // MenuController's existing UserRole.ADMIN-permitted endpoints — no new
  // backend surface needed here.

  // ── Section 15: Reviews ──────────────────────────────────────────────────

  listReviews(params: { visible?: "visible" | "hidden" }) {
    const qb = this.reviews.createQueryBuilder("rv").orderBy("rv.createdAt", "DESC");
    if (params.visible === "visible") qb.andWhere("rv.isHidden = false");
    if (params.visible === "hidden") qb.andWhere("rv.isHidden = true");
    return qb.getMany();
  }

  async setReviewVisibility(id: string, isHidden: boolean, actorId: string) {
    const review = await this.reviews.findOne({ where: { id } });
    if (!review) throw new NotFoundException("Review not found");
    await this.reviews.update(id, { isHidden });
    await this.log(actorId, isHidden ? "review.hidden" : "review.unhidden", "review", id);
    return this.reviews.findOne({ where: { id } });
  }

  // ── Section 16: Live Operations (existing activeDeliveries, unchanged) ──

  async activeDeliveries() {
    const active = await this.deliveries
      .createQueryBuilder("d")
      .where("d.stage != :delivered", { delivered: "DELIVERED" })
      .getMany();
    const driverIds = active.map((d) => d.driverId).filter(Boolean) as string[];
    const profiles = driverIds.length
      ? await this.drivers
          .createQueryBuilder("p")
          .where("p.userId IN (:...ids)", { ids: driverIds })
          .getMany()
      : [];
    return active.map((d) => ({
      ...this.redactOtps(d),
      driverLocation: profiles.find((p) => p.userId === d.driverId) ?? null,
    }));
  }

  // ── Section 12/13: Coupons & Offers (admin-wide view) ────────────────────
  // "Offers" is deliberately not a separate entity/table — it's the same
  // CouponEntity, filtered to restaurantId IS NULL (platform-wide, matching
  // section 13's Platform/First-Order offer concept) so the two systems can
  // never drift apart. `scope=platform` -> offers view, `scope=restaurant`
  // -> restaurant-specific coupons, omitted -> everything.
  listCoupons(scope?: "platform" | "restaurant") {
    const qb = this.coupons.createQueryBuilder("c").orderBy("c.createdAt", "DESC");
    if (scope === "platform") qb.andWhere("c.restaurantId IS NULL");
    if (scope === "restaurant") qb.andWhere("c.restaurantId IS NOT NULL");
    return qb.getMany();
  }

  // ── Section 22: Global Search ─────────────────────────────────────────────

  async globalSearch(q: string) {
    if (!q || q.trim().length < 2) return { orders: [], customers: [], restaurants: [], drivers: [], coupons: [] };
    const s = `%${q.trim()}%`;

    const [orderRows, customerRows, restaurantRows, driverRows, couponRows] = await Promise.all([
      this.orders
        .createQueryBuilder("o")
        .where("CAST(o.id AS TEXT) ILIKE :s", { s })
        .orderBy("o.createdAt", "DESC")
        .limit(10)
        .getMany(),
      this.users
        .createQueryBuilder("u")
        .where("u.role = :role AND (u.name ILIKE :s OR u.email ILIKE :s)", {
          role: UserRole.CUSTOMER,
          s,
        })
        .limit(10)
        .getMany(),
      this.restaurants.createQueryBuilder("r").where("r.name ILIKE :s", { s }).limit(10).getMany(),
      this.users
        .createQueryBuilder("u")
        .where("u.role = :role AND (u.name ILIKE :s OR u.email ILIKE :s)", {
          role: UserRole.DELIVERY_PARTNER,
          s,
        })
        .limit(10)
        .getMany(),
      this.coupons.createQueryBuilder("c").where("c.code ILIKE :s", { s }).limit(10).getMany(),
    ]);

    return {
      orders: orderRows,
      customers: customerRows.map((c) => this.sanitizeUser(c)),
      restaurants: restaurantRows,
      drivers: driverRows.map((d) => this.sanitizeUser(d)),
      coupons: couponRows,
    };
  }

  // ── Section 20: Financial Reporting ──────────────────────────────────────

  async financialReport(from: string, to: string) {
    const delivered = await this.orders
      .createQueryBuilder("o")
      .innerJoin(RestaurantEntity, "r", "r.id::text = o.restaurantId")
      .select("COALESCE(SUM(o.grandTotal), 0)", "gmv")
      .addSelect("COALESCE(SUM(o.itemTotal * r.commissionRate), 0)", "platformCommission")
      .addSelect("COALESCE(SUM(o.itemTotal * (1 - r.commissionRate)), 0)", "restaurantRevenue")
      .addSelect("COALESCE(SUM(o.deliveryFee), 0)", "deliveryFees")
      .addSelect("COALESCE(SUM(o.discountAmount), 0)", "discounts")
      .addSelect("COALESCE(SUM(o.platformFee), 0)", "platformFees")
      .where("o.status = :delivered", { delivered: OrderStatus.DELIVERED })
      .andWhere(`o."createdAt" >= :from::date AND o."createdAt" < (:to::date + interval '1 day')`, {
        from,
        to,
      })
      .getRawOne<{
        gmv: string;
        platformCommission: string;
        restaurantRevenue: string;
        deliveryFees: string;
        discounts: string;
        platformFees: string;
      }>();

    const driverEarnings = await this.deliveries
      .createQueryBuilder("d")
      .select("COALESCE(SUM(d.basePay + d.distancePay + d.surgeBonus + d.tip), 0)", "total")
      .where("d.stage = 'DELIVERED'")
      .andWhere(
        `d."deliveredAt" IS NOT NULL AND d."deliveredAt" >= :from AND d."deliveredAt" < :toEnd`,
        { from: `${from}T00:00:00.000Z`, toEnd: `${to}T23:59:59.999Z` },
      )
      .getRawOne<{ total: string }>();

    const refunds = await this.refundsRepo
      .createQueryBuilder("r")
      .select("COALESCE(SUM(r.refundAmount), 0)", "total")
      .where("r.status = :status", { status: RefundStatus.REFUNDED })
      .andWhere(`r."processedAt" >= :from AND r."processedAt" < :toEnd`, {
        from: `${from}T00:00:00.000Z`,
        toEnd: `${to}T23:59:59.999Z`,
      })
      .getRawOne<{ total: string }>();

    const settlementTotals = async (status: WithdrawalStatus[]) => {
      const row = await this.withdrawals
        .createQueryBuilder("w")
        .select("COALESCE(SUM(w.amount), 0)", "total")
        .where("w.status IN (:...statuses)", { statuses: status })
        .getRawOne<{ total: string }>();
      return Number(row?.total ?? 0);
    };
    const [pendingSettlements, completedSettlements] = await Promise.all([
      settlementTotals([WithdrawalStatus.PENDING, WithdrawalStatus.PROCESSING]),
      settlementTotals([WithdrawalStatus.COMPLETED]),
    ]);

    const platformCommission = Number(delivered?.platformCommission ?? 0);
    const platformFees = Number(delivered?.platformFees ?? 0);
    const refundTotal = Number(refunds?.total ?? 0);

    return {
      range: { from, to },
      gmv: Number(delivered?.gmv ?? 0),
      platformRevenue: platformCommission + platformFees,
      restaurantRevenue: Number(delivered?.restaurantRevenue ?? 0),
      driverEarnings: Number(driverEarnings?.total ?? 0),
      deliveryFees: Number(delivered?.deliveryFees ?? 0),
      discounts: Number(delivered?.discounts ?? 0),
      refunds: refundTotal,
      netRevenue: platformCommission + platformFees - refundTotal,
      pendingSettlements,
      completedSettlements,
    };
  }

  // ── Section 19: Audit Log ────────────────────────────────────────────────

  auditLog() {
    return this.auditLogs.find({ order: { createdAt: "DESC" }, take: 200 });
  }

  async log(actorId: string, action: string, entityType: string, entityId: string) {
    await this.auditLogs.save(
      this.auditLogs.create({ actorId, action, entityType, entityId }),
    );
  }
}
