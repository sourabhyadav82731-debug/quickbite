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

  @Column({ type: "int", default: 0 })
  timesUsed: number;

  @Column()
  expiresAt: string;

  @Column({ default: true })
  isActive: boolean;
}
