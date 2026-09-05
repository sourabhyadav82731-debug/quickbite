import { Column, Entity, Index } from "typeorm";
import { VehicleType } from "@quickbite/types";
import { BaseEntity } from "./base.entity";

@Entity("driver_profiles")
export class DriverProfileEntity extends BaseEntity {
  @Index({ unique: true })
  @Column()
  userId: string;

  @Column({ type: "varchar" })
  vehicleType: VehicleType;

  @Column()
  vehicleNumber: string;

  @Column({ default: false })
  isOnline: boolean;

  @Column({ type: "float", nullable: true })
  currentLat?: number;

  @Column({ type: "float", nullable: true })
  currentLng?: number;

  // ISO string. Lets a consumer tell a fresh live position apart from a stale
  // one left over from a driver who went offline or lost connectivity mid-
  // delivery — currentLat/currentLng alone can't distinguish those cases.
  @Column({ nullable: true })
  locationUpdatedAt?: string;

  @Column({ type: "float", default: 4.5 })
  rating: number;

  @Column({ type: "int", default: 0 })
  ratingCount: number;

  @Column({ type: "float", default: 96 })
  acceptanceRate: number;

  @Column({ type: "float", default: 97.5 })
  onTimeRate: number;

  @Column({ type: "float", default: 0 })
  codCashInHand: number;
}
