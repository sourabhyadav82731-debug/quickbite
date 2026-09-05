import { Column, Entity, Index } from "typeorm";
import { CartAddonSelection } from "@quickbite/types";
import { BaseEntity } from "./base.entity";

@Entity("order_items")
export class OrderItemEntity extends BaseEntity {
  @Index()
  @Column()
  orderId: string;

  @Column()
  dishId: string;

  @Column()
  nameSnapshot: string;

  // Customer-facing unit price at order time (dish.customerPrice ?? dish.discountPrice ?? dish.price).
  @Column({ type: "float" })
  unitPriceSnapshot: number;

  // Restaurant's own base-price snapshot at order time (dish.price), independent of
  // whatever the customer paid — so a later dish.price edit never rewrites history.
  @Column({ type: "float" })
  restaurantPriceSnapshot: number;

  @Column({ type: "int" })
  quantity: number;

  @Column({ type: "simple-json", default: "[]" })
  addons: CartAddonSelection[];
}
