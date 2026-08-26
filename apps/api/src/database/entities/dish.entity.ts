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

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ type: "simple-array", default: "" })
  dietaryTags: DietaryTag[];

  @Column({ type: "int", nullable: true })
  calories?: number;

  @Column({ default: true })
  isInStock: boolean;
}
