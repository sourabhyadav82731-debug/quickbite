import { Column, Entity, Index } from "typeorm";
import { RestaurantAvailabilityStatus, RestaurantStatus, WeeklyHours } from "@quickbite/types";
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

  // Owner-controlled real-time availability toggle — distinct from `status`
  // (admin-controlled approval/suspension above). `isAcceptingOrders` is kept
  // in sync with this (true only when OPEN) purely so every pre-existing read
  // path that already depends on that boolean (customer discover-page
  // filtering, etc.) keeps working unchanged; new code should read
  // `availabilityStatus` directly.
  @Column({ type: "varchar", default: RestaurantAvailabilityStatus.OPEN })
  availabilityStatus: RestaurantAvailabilityStatus;

  @Column({ nullable: true })
  pauseReason?: string;

  // Fixed 7-entry weekly schedule — simple-json (portable across the
  // sqlite/postgres split, same as other structured columns in this codebase)
  // rather than a separate table, since it's always exactly 7 rows keyed by
  // day-of-week, never a variable-length collection.
  @Column({ type: "simple-json", nullable: true })
  hours?: WeeklyHours;

  @Column({ default: true })
  isAcceptingOrders: boolean;
}
