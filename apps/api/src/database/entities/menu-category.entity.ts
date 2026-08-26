import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity("menu_categories")
export class MenuCategoryEntity extends BaseEntity {
  @Index()
  @Column()
  restaurantId: string;

  @Column()
  name: string;

  @Column({ type: "int", default: 0 })
  sortOrder: number;
}
