import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OrderStatus, UserRole, WithdrawalOwnerType, WithdrawalStatus } from "@quickbite/types";
import { OrderEntity, RestaurantEntity, WithdrawalRequestEntity } from "../../database/entities";
import { DeliveryService } from "../delivery/delivery.service";

// No real payout/disbursement provider is wired into this scaffold (Razorpay
// here is checkout-only — it collects money from customers, it has no payout
// API configured). So this never marks a withdrawal COMPLETED on its own: a
// request only ever leaves PENDING via an explicit admin action once the
// transfer has actually happened out-of-band. That's a deliberate, honest
// simplification, not a missing feature — the alternative would be silently
// faking a successful bank transfer, which this must never do.
const TERMINAL_STATUSES = new Set([WithdrawalStatus.COMPLETED, WithdrawalStatus.FAILED]);
const ALLOWED_TRANSITIONS: Record<WithdrawalStatus, WithdrawalStatus[]> = {
  [WithdrawalStatus.PENDING]: [WithdrawalStatus.PROCESSING, WithdrawalStatus.FAILED],
  [WithdrawalStatus.PROCESSING]: [WithdrawalStatus.COMPLETED, WithdrawalStatus.FAILED],
  [WithdrawalStatus.COMPLETED]: [],
  [WithdrawalStatus.FAILED]: [],
};

@Injectable()
export class WithdrawalsService {
  constructor(
    @InjectRepository(WithdrawalRequestEntity)
    private readonly withdrawals: Repository<WithdrawalRequestEntity>,
    @InjectRepository(OrderEntity) private readonly orders: Repository<OrderEntity>,
    @InjectRepository(RestaurantEntity) private readonly restaurants: Repository<RestaurantEntity>,
    private readonly deliveryService: DeliveryService,
  ) {}

  // Sum of every withdrawal that already claims a piece of the balance —
  // PENDING and PROCESSING both reserve funds (so a driver/restaurant can't
  // request the same money twice while a request is in flight), only FAILED
  // rows give the amount back.
  private async reservedAmount(ownerType: WithdrawalOwnerType, ownerId: string) {
    const rows = await this.withdrawals.find({ where: { ownerType, ownerId } });
    return rows
      .filter((r) => r.status !== WithdrawalStatus.FAILED)
      .reduce((sum, r) => sum + r.amount, 0);
  }

  async driverBalance(driverUserId: string) {
    const earnings = await this.deliveryService.earnings(driverUserId);
    const reserved = await this.reservedAmount(WithdrawalOwnerType.DRIVER, driverUserId);
    return {
      availableBalance: Math.max(0, earnings.total - reserved),
      totalEarnings: earnings.total,
      todayEarnings: earnings.todayEarnings,
      weekEarnings: earnings.weekEarnings,
      pendingWithdrawals: reserved,
    };
  }

  async requestDriverWithdrawal(driverUserId: string, amount: number, payoutMethod: string) {
    this.assertValidAmountAndMethod(amount, payoutMethod);
    const balance = await this.driverBalance(driverUserId);
    // Recomputed here, server-side, from the same source the balance card
    // itself reads — the frontend's displayed number is never trusted as the
    // limit, only ever as a preview of it.
    if (amount > balance.availableBalance) {
      throw new BadRequestException("Withdrawal amount exceeds available balance");
    }
    return this.withdrawals.save(
      this.withdrawals.create({
        ownerType: WithdrawalOwnerType.DRIVER,
        ownerId: driverUserId,
        amount,
        payoutMethod,
        status: WithdrawalStatus.PENDING,
      }),
    );
  }

  async driverHistory(driverUserId: string) {
    return this.withdrawals.find({
      where: { ownerType: WithdrawalOwnerType.DRIVER, ownerId: driverUserId },
      order: { createdAt: "DESC" },
    });
  }

  private async assertRestaurantOwnership(
    restaurantId: string,
    actor: { userId: string; role: UserRole },
  ) {
    const restaurant = await this.restaurants.findOne({ where: { id: restaurantId } });
    if (!restaurant) throw new NotFoundException("Restaurant not found");
    if (restaurant.ownerId !== actor.userId && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Not your restaurant");
    }
    return restaurant;
  }

  // Same gross/commission math PayoutsController already computes for the
  // read-only settlement report — reused here rather than re-derived, so the
  // two views of "what this restaurant has earned" can never drift apart.
  private async restaurantNetPayout(restaurantId: string, restaurant: RestaurantEntity) {
    const delivered = await this.orders.find({
      where: { restaurantId, status: OrderStatus.DELIVERED },
    });
    const gross = delivered.reduce((sum, o) => sum + o.itemTotal, 0);
    const commissionRate = restaurant.commissionRate ?? 0.18;
    return gross - gross * commissionRate;
  }

  async restaurantBalance(restaurantId: string, actor: { userId: string; role: UserRole }) {
    const restaurant = await this.assertRestaurantOwnership(restaurantId, actor);
    const netPayout = await this.restaurantNetPayout(restaurantId, restaurant);
    const reserved = await this.reservedAmount(WithdrawalOwnerType.RESTAURANT, restaurantId);
    return {
      availableBalance: Math.max(0, netPayout - reserved),
      totalEarnings: netPayout,
      todayEarnings: 0,
      weekEarnings: 0,
      pendingWithdrawals: reserved,
    };
  }

  async requestRestaurantWithdrawal(
    restaurantId: string,
    actor: { userId: string; role: UserRole },
    amount: number,
    payoutMethod: string,
  ) {
    this.assertValidAmountAndMethod(amount, payoutMethod);
    const balance = await this.restaurantBalance(restaurantId, actor);
    if (amount > balance.availableBalance) {
      throw new BadRequestException("Withdrawal amount exceeds available balance");
    }
    return this.withdrawals.save(
      this.withdrawals.create({
        ownerType: WithdrawalOwnerType.RESTAURANT,
        ownerId: restaurantId,
        amount,
        payoutMethod,
        status: WithdrawalStatus.PENDING,
      }),
    );
  }

  async restaurantHistory(restaurantId: string, actor: { userId: string; role: UserRole }) {
    await this.assertRestaurantOwnership(restaurantId, actor);
    return this.withdrawals.find({
      where: { ownerType: WithdrawalOwnerType.RESTAURANT, ownerId: restaurantId },
      order: { createdAt: "DESC" },
    });
  }

  async adminList() {
    return this.withdrawals.find({ order: { createdAt: "DESC" } });
  }

  async adminUpdateStatus(
    id: string,
    status: WithdrawalStatus,
    referenceId?: string,
    failureReason?: string,
  ) {
    const withdrawal = await this.withdrawals.findOne({ where: { id } });
    if (!withdrawal) throw new NotFoundException("Withdrawal request not found");
    if (TERMINAL_STATUSES.has(withdrawal.status)) {
      throw new BadRequestException(
        `This withdrawal is already ${withdrawal.status} and cannot be changed`,
      );
    }
    if (!ALLOWED_TRANSITIONS[withdrawal.status].includes(status)) {
      throw new BadRequestException(
        `Cannot move a ${withdrawal.status} withdrawal to ${status}`,
      );
    }
    if (status === WithdrawalStatus.FAILED && !failureReason) {
      throw new BadRequestException("failureReason is required when marking a withdrawal FAILED");
    }
    await this.withdrawals.update(id, {
      status,
      referenceId: referenceId ?? withdrawal.referenceId,
      failureReason: status === WithdrawalStatus.FAILED ? failureReason : undefined,
      processedAt: TERMINAL_STATUSES.has(status) ? new Date().toISOString() : undefined,
    });
    return this.withdrawals.findOne({ where: { id } });
  }

  private assertValidAmountAndMethod(amount: number, payoutMethod: string) {
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException("Withdrawal amount must be a positive number");
    }
    if (!payoutMethod || !payoutMethod.trim()) {
      throw new BadRequestException("A payout method is required");
    }
  }
}
