import { Column, Entity, Index } from "typeorm";
import { DietaryTag } from "@quickbite/types";
import { BaseEntity } from "./base.entity";

@Entity("dishes")
export class DishEntity extends BaseEntity {
  @Index()
  @Column()
  restaurantId: string;

  @Index()
  @Column()
  categoryId: string;

  @Column()
  name: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "float" })
  price: number;

  @Column({ type: "float", nullable: true })
  discountPrice?: number;

  // Customer-facing selling price. Separate from `price` (the restaurant's own
  // base/cost price, which they enter and see, untouched by this). Null until
  // explicitly configured (admin-only) — the effective price customers pay falls
  // back to `discountPrice ?? price` until then, so existing dishes are unaffected.
  @Column({ type: "float", nullable: true })
  customerPrice?: number;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ type: "simple-array", default: "" })
  dietaryTags: DietaryTag[];

  @Column({ type: "int", nullable: true })
  calories?: number;

  @Column({ default: true })
  isInStock: boolean;
}
