import { Column, Entity, Index } from "typeorm";
import { CouponType } from "@quickbite/types";
import { BaseEntity } from "./base.entity";

@Entity("coupons")
export class CouponEntity extends BaseEntity {
  @Index({ unique: true })
  @Column()
  code: string;

  @Column({ nullable: true })
  restaurantId?: string;

  @Column({ type: "varchar" })
  type: CouponType;

  @Column({ type: "float" })
  value: number;

  @Column({ type: "float", default: 0 })
  minOrderValue: number;

  @Column({ type: "float", nullable: true })
  maxDiscount?: number;

  @Column({ type: "int", nullable: true })
  usageLimit?: number;

  // How many times a single customer may use this coupon, independent of the
  // platform-wide usageLimit above — enforced by counting that customer's own
  // past orders with this couponId, not a separate redemption-tracking table.
  @Column({ type: "int", nullable: true })
  perUserLimit?: number;

  @Column({ type: "int", default: 0 })
  timesUsed: number;

  // Nullable = always-active-from-creation (every pre-existing coupon
  // behaves exactly as before). When set and in the future, the coupon is
  // "Scheduled" rather than "Active" — computed by callers from
  // startsAt/expiresAt/isActive, not a separate status column, so it can
  // never drift out of sync with them.
  @Column({ nullable: true })
  startsAt?: string;

  @Column()
  expiresAt: string;

  @Column({ default: true })
  isActive: boolean;
}
