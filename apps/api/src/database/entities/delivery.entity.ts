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

  // App-generated ISO string, set explicitly when advanceStage transitions to
  // DELIVERED — deliberately NOT the inherited BaseEntity.updatedAt (a real
  // Postgres `timestamp without time zone` column). Reading that back through
  // node-postgres/TypeORM on a non-UTC host silently applies the wrong
  // offset, which is exactly what was making earnings()'s today/week
  // boundary comparisons unreliable. Plain ISO string, always compared in JS,
  // never bound as a Date query parameter — the same pattern already used
  // safely for expiresAt/offerExpiresAt elsewhere in this codebase.
  @Column({ nullable: true })
  deliveredAt?: string;
}
