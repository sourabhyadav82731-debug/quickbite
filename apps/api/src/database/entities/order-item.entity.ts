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

  @Column({ type: "float" })
  unitPriceSnapshot: number;

  @Column({ type: "int" })
  quantity: number;

  @Column({ type: "simple-json", default: "[]" })
  addons: CartAddonSelection[];
}
