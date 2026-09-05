import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CouponType, UserRole } from "@quickbite/types";
import { CouponInput, CouponUpdateInput } from "@quickbite/validation";
import { CouponEntity, OrderEntity, RestaurantEntity } from "../../database/entities";

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(CouponEntity) private readonly coupons: Repository<CouponEntity>,
    @InjectRepository(RestaurantEntity)
    private readonly restaurants: Repository<RestaurantEntity>,
    @InjectRepository(OrderEntity) private readonly orders: Repository<OrderEntity>,
  ) {}

  list() {
    return this.coupons.find({ where: { isActive: true }, order: { createdAt: "DESC" } });
  }

  // Every status (Active/Scheduled/Expired/Paused), not just isActive:true —
  // list() above stays public/checkout-facing and unchanged; this is the
  // owner-facing "my campaigns" view.
  async listMine(restaurantId: string, actor: { userId: string; role: UserRole }) {
    await this.assertOwnership(restaurantId, actor);
    return this.coupons.find({ where: { restaurantId }, order: { createdAt: "DESC" } });
  }

  private async assertOwnership(restaurantId: string, actor: { userId: string; role: UserRole }) {
    const restaurant = await this.restaurants.findOne({ where: { id: restaurantId } });
    if (!restaurant) throw new NotFoundException("Restaurant not found");
    if (restaurant.ownerId !== actor.userId && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Not your restaurant");
    }
    return restaurant;
  }

  async create(input: CouponInput, actor: { userId: string; role: UserRole }) {
    // Previously restaurantId was accepted from the request body with no
    // check at all — any restaurant owner could create a coupon (or even a
    // platform-wide one, restaurantId omitted) attributed to any restaurant.
    // A platform-wide coupon (no restaurantId) remains admin-only, since a
    // restaurant owner creating one would apply a discount funded across
    // every other restaurant's orders too.
    if (input.restaurantId) {
      await this.assertOwnership(input.restaurantId, actor);
    } else if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Only admin can create a platform-wide coupon");
    }
    return this.coupons.save(this.coupons.create(input as Partial<CouponEntity>));
  }

  async update(
    couponId: string,
    actor: { userId: string; role: UserRole },
    patch: CouponUpdateInput,
  ) {
    const coupon = await this.coupons.findOne({ where: { id: couponId } });
    if (!coupon) throw new NotFoundException("Coupon not found");
    if (coupon.restaurantId) {
      await this.assertOwnership(coupon.restaurantId, actor);
    } else if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Only admin can edit a platform-wide coupon");
    }
    await this.coupons.update(couponId, patch as Partial<CouponEntity>);
    return this.coupons.findOne({ where: { id: couponId } });
  }

  async validate(code: string, orderValue: number, customerId?: string) {
    const coupon = await this.coupons.findOne({ where: { code: code.toUpperCase() } });
    if (!coupon) throw new NotFoundException("Coupon not found");

    const now = new Date();
    let underPerUserLimit = true;
    if (coupon.perUserLimit && customerId) {
      const usedByCustomer = await this.orders.count({
        where: { couponId: coupon.id, customerId },
      });
      underPerUserLimit = usedByCustomer < coupon.perUserLimit;
    }

    const valid =
      coupon.isActive &&
      orderValue >= coupon.minOrderValue &&
      (!coupon.startsAt || new Date(coupon.startsAt) <= now) &&
      new Date(coupon.expiresAt) > now &&
      (!coupon.usageLimit || coupon.timesUsed < coupon.usageLimit) &&
      underPerUserLimit;

    let discount = 0;
    if (valid) {
      if (coupon.type === CouponType.PERCENTAGE) {
        discount = (orderValue * coupon.value) / 100;
        if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
      } else if (coupon.type === CouponType.FLAT) {
        discount = coupon.value;
      }
    }
    return { valid, coupon, discount };
  }
}
