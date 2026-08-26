import { Column, Entity, Index } from "typeorm";
import { RestaurantStatus } from "@quickbite/types";
import { RESTAURANT_COMMISSION_RATE } from "@quickbite/config";
import { BaseEntity } from "./base.entity";

@Entity("restaurants")
export class RestaurantEntity extends BaseEntity {
  @Index()
  @Column()
  ownerId: string;

  @Column()
  name: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "simple-array", default: "" })
  cuisines: string[];

  @Column({ nullable: true })
  coverImageUrl?: string;

  @Column({ nullable: true })
  fssaiLicense?: string;

  @Column({ type: "varchar", default: RestaurantStatus.PENDING_APPROVAL })
  status: RestaurantStatus;

  @Column({ type: "float", default: RESTAURANT_COMMISSION_RATE })
  commissionRate: number;

  @Column({ type: "float", default: 4.2 })
  rating: number;

  @Column({ type: "int", default: 0 })
  ratingCount: number;

  @Column({ type: "int", default: 30 })
  avgPrepTimeMinutes: number;

  @Column({ type: "float", default: 300 })
  costForTwo: number;

  @Column({ type: "float", default: 5 })
  deliveryRadiusKm: number;

  @Column({ type: "float", default: 0 })
  lat: number;

  @Column({ type: "float", default: 0 })
  lng: number;

  @Column({ default: true })
  isAcceptingOrders: boolean;
}
