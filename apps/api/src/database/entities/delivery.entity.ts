import { Column, Entity, Index } from "typeorm";
import { DeliveryStage } from "@quickbite/types";
import { BaseEntity } from "./base.entity";

@Entity("deliveries")
export class DeliveryEntity extends BaseEntity {
  @Index({ unique: true })
  @Column()
  orderId: string;

  @Index()
  @Column({ nullable: true })
  driverId?: string;

  @Column({ type: "varchar", default: DeliveryStage.ASSIGNED })
  stage: DeliveryStage;

  @Column()
  pickupOtp: string;

  @Column()
  dropOtp: string;

  @Column({ type: "float", default: 0 })
  basePay: number;

  @Column({ type: "float", default: 0 })
  distancePay: number;

  @Column({ type: "float", default: 0 })
  surgeBonus: number;

  @Column({ type: "float", default: 0 })
  tip: number;

  @Column({ type: "float", default: 0 })
  distanceKm: number;

  @Column({ nullable: true })
  offerExpiresAt?: string;
}
