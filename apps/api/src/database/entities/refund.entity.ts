import { Column, Entity, Index } from "typeorm";
import { RefundStatus, UserRole } from "@quickbite/types";
import { BaseEntity } from "./base.entity";

@Entity("refunds")
export class RefundEntity extends BaseEntity {
  @Index()
  @Column()
  orderId: string;

  @Column()
  customerId: string;

  @Column()
  restaurantId: string;

  @Column({ type: "float" })
  orderAmount: number;

  @Column({ type: "float" })
  refundAmount: number;

  @Column({ type: "text" })
  reason: string;

  @Column({ type: "varchar", default: RefundStatus.REQUESTED })
  status: RefundStatus;

  // Real Razorpay refund id once the online-payment refund actually succeeds
  // via razorpay.payments.refund() — never set to a made-up value. COD
  // orders have no gateway money to reverse, so this stays null for them
  // even after status reaches REFUNDED (there's an adminNote instead
  // recording how the cash was actually settled).
  @Column({ nullable: true })
  razorpayRefundId?: string;

  @Column({ nullable: true })
  adminNote?: string;

  // Who actually filed the request — a customer self-service request and an
  // admin/support-initiated one both flow through the same REQUESTED state,
  // but the transition-history timeline (section 5) needs to attribute the
  // event to the real actor, not assume it was always an admin action.
  @Column()
  requestedByUserId: string;

  @Column({ type: "varchar" })
  requestedByRole: UserRole;

  @Column()
  requestedAt: string;

  @Column({ nullable: true })
  processedAt?: string;

  @Column({ nullable: true })
  processedByAdminId?: string;
}
