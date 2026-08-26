import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity("reviews")
export class ReviewEntity extends BaseEntity {
  @Column()
  authorId: string;

  @Index()
  @Column({ nullable: true })
  restaurantId?: string;

  @Index()
  @Column({ nullable: true })
  driverId?: string;

  @Column()
  orderId: string;

  @Column({ type: "float" })
  foodRating: number;

  @Column({ type: "float", nullable: true })
  packagingRating?: number;

  @Column({ type: "float", nullable: true })
  deliveryRating?: number;

  @Column({ type: "text", nullable: true })
  comment?: string;

  @Column({ type: "text", nullable: true })
  ownerReply?: string;
}
