import { Column, Entity, Index } from "typeorm";
import { OrderStatus } from "@quickbite/types";
import { BaseEntity } from "./base.entity";

// No order-transition audit trail existed anywhere in this codebase before —
// OrderEntity only ever stored its current `status`, overwritten on every
// transition with no record of what came before. This is the "necessary
// backend event mechanism" going forward: every status change (checkout,
// restaurant actions, driver stage advances, cancellation, refund) inserts
// one row here instead of just overwriting the order. Deliberately append-
// only — never updated or deleted — so it stays a trustworthy audit log.
// Only ever backfilled for orders placed after this was added; earlier
// orders simply have no rows here, and the frontend must show that plainly
// rather than inventing history for them.
@Entity("order_status_history")
export class OrderStatusHistoryEntity extends BaseEntity {
  @Index()
  @Column()
  orderId: string;

  @Column({ type: "varchar" })
  status: OrderStatus;

  // Who/what caused this transition — not a foreign key to a single actor
  // table, since the actor differs by type (customer, restaurant owner,
  // driver, admin, or the system itself for automated transitions).
  @Column({ type: "varchar" })
  actorType: string;

  @Column({ nullable: true })
  actorId?: string;

  @Column({ nullable: true })
  note?: string;

  // App-generated ISO string, not just the inherited BaseEntity.createdAt —
  // same reasoning as DeliveryEntity.deliveredAt: a real `timestamp without
  // time zone` column reads back wrong on a non-UTC host, and this table's
  // entire purpose is being an accurate, orderable timeline.
  @Column()
  occurredAt: string;
}
