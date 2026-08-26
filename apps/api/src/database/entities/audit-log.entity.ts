import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity("audit_logs")
export class AuditLogEntity extends BaseEntity {
  @Column()
  actorId: string;

  @Column()
  action: string;

  @Index()
  @Column()
  entityType: string;

  @Column()
  entityId: string;

  @Column({ type: "simple-json", nullable: true })
  metadata?: Record<string, unknown>;
}
