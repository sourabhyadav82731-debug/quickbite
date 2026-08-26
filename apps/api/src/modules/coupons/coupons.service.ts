import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CouponType } from "@quickbite/types";
import { CouponInput } from "@quickbite/validation";
import { CouponEntity } from "../../database/entities";

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(CouponEntity) private readonly coupons: Repository<CouponEntity>,
  ) {}

  list() {
    return this.coupons.find({ where: { isActive: true }, order: { createdAt: "DESC" } });
  }

  create(input: CouponInput) {
    return this.coupons.save(this.coupons.create(input as Partial<CouponEntity>));
  }

  async validate(code: string, orderValue: number) {
    const coupon = await this.coupons.findOne({ where: { code: code.toUpperCase() } });
    if (!coupon) throw new NotFoundException("Coupon not found");

    const valid =
      coupon.isActive &&
      orderValue >= coupon.minOrderValue &&
      new Date(coupon.expiresAt) > new Date() &&
      (!coupon.usageLimit || coupon.timesUsed < coupon.usageLimit);

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
