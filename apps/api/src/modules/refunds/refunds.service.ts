import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OrderStatus, RefundStatus, UserRole } from "@quickbite/types";
import { AuditLogEntity, OrderEntity, RefundEntity } from "../../database/entities";
import { PaymentsService } from "../payments/payments.service";

// A refund only ever makes sense against an order that was actually paid for
// and has reached a terminal state — never mid-flight (still being prepared
// or out for delivery).
const REFUNDABLE_ORDER_STATUSES: OrderStatus[] = [OrderStatus.DELIVERED, OrderStatus.CANCELLED];

@Injectable()
export class RefundsService {
  constructor(
    @InjectRepository(RefundEntity) private readonly refunds: Repository<RefundEntity>,
    @InjectRepository(OrderEntity) private readonly orders: Repository<OrderEntity>,
    @InjectRepository(AuditLogEntity) private readonly auditLogs: Repository<AuditLogEntity>,
    private readonly paymentsService: PaymentsService,
  ) {}

  private async log(actorId: string, action: string, entityId: string) {
    await this.auditLogs.save(
      this.auditLogs.create({ actorId, action, entityType: "refund", entityId }),
    );
  }

  /** Called either by the customer themselves (self-service, on their own
   *  delivered/cancelled order) or by an admin acting on a support request —
   *  the actor's role decides which ownership check applies. */
  async request(
    orderId: string,
    actor: { userId: string; role: UserRole },
    reason: string,
    refundAmount?: number,
  ) {
    const order = await this.orders.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException("Order not found");
    if (actor.role !== UserRole.ADMIN && order.customerId !== actor.userId) {
      throw new ForbiddenException("Not your order");
    }
    if (!REFUNDABLE_ORDER_STATUSES.includes(order.status)) {
      throw new BadRequestException(
        `Orders in ${order.status} status are not eligible for a refund`,
      );
    }
    const existing = await this.refunds.findOne({
      where: { orderId },
      order: { createdAt: "DESC" },
    });
    if (existing && existing.status !== RefundStatus.REJECTED) {
      throw new BadRequestException("A refund is already in progress for this order");
    }

    const amount = refundAmount ?? order.grandTotal;
    if (amount <= 0 || amount > order.grandTotal) {
      throw new BadRequestException("Invalid refund amount");
    }

    const refund = await this.refunds.save(
      this.refunds.create({
        orderId,
        customerId: order.customerId,
        restaurantId: order.restaurantId,
        orderAmount: order.grandTotal,
        refundAmount: amount,
        reason,
        status: RefundStatus.REQUESTED,
        requestedByUserId: actor.userId,
        requestedByRole: actor.role,
        requestedAt: new Date().toISOString(),
      }),
    );
    await this.log(actor.userId, "refund.requested", refund.id);
    return refund;
  }

  list(filters: { status?: RefundStatus; search?: string }) {
    const qb = this.refunds.createQueryBuilder("r").orderBy("r.createdAt", "DESC");
    if (filters.status) qb.andWhere("r.status = :status", { status: filters.status });
    if (filters.search) {
      qb.andWhere("(r.orderId ILIKE :s OR r.customerId ILIKE :s OR r.restaurantId ILIKE :s)", {
        s: `%${filters.search}%`,
      });
    }
    return qb.getMany();
  }

  async get(id: string) {
    const refund = await this.refunds.findOne({ where: { id } });
    if (!refund) throw new NotFoundException("Refund not found");
    return refund;
  }

  async approve(id: string, adminId: string) {
    const refund = await this.get(id);
    if (refund.status !== RefundStatus.REQUESTED) {
      throw new BadRequestException(`Cannot approve a refund in ${refund.status} status`);
    }
    await this.refunds.update(id, { status: RefundStatus.APPROVED });
    await this.log(adminId, "refund.approved", id);
    return this.get(id);
  }

  async reject(id: string, adminId: string, note: string) {
    const refund = await this.get(id);
    if (refund.status !== RefundStatus.REQUESTED) {
      throw new BadRequestException(`Cannot reject a refund in ${refund.status} status`);
    }
    await this.refunds.update(id, {
      status: RefundStatus.REJECTED,
      adminNote: note,
      processedAt: new Date().toISOString(),
      processedByAdminId: adminId,
    });
    await this.log(adminId, "refund.rejected", id);
    return this.get(id);
  }

  /** Actually moves money (for online payments, via real Razorpay refund; for
   *  COD, only records how the cash was returned — adminNote is mandatory
   *  there since it's the only record of what actually happened). */
  async process(id: string, adminId: string, adminNote?: string) {
    const refund = await this.get(id);
    if (refund.status !== RefundStatus.APPROVED) {
      throw new BadRequestException(`Cannot process a refund in ${refund.status} status`);
    }
    await this.refunds.update(id, { status: RefundStatus.PROCESSING });

    try {
      const amountPaise = Math.round(refund.refundAmount * 100);
      const result = await this.paymentsService.refundPayment(refund.orderId, amountPaise);
      await this.refunds.update(id, {
        status: RefundStatus.REFUNDED,
        razorpayRefundId: result.razorpayRefundId,
        adminNote,
        processedAt: new Date().toISOString(),
        processedByAdminId: adminId,
      });
      await this.log(adminId, "refund.processed", id);
      return this.get(id);
    } catch (err) {
      // Roll back to APPROVED (not stuck at PROCESSING forever) so the admin
      // can retry once the underlying gateway issue is resolved.
      await this.refunds.update(id, { status: RefundStatus.APPROVED });
      throw err;
    }
  }

  async totalRefundedAmount(): Promise<number> {
    const row = await this.refunds
      .createQueryBuilder("r")
      .select("COALESCE(SUM(r.refundAmount), 0)", "total")
      .where("r.status = :status", { status: RefundStatus.REFUNDED })
      .getRawOne<{ total: string }>();
    return Number(row?.total ?? 0);
  }
}
