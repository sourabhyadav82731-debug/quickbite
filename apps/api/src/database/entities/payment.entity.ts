import { Column, Entity, Index } from "typeorm";
import { PaymentMethod, PaymentStatus } from "@quickbite/types";
import { BaseEntity } from "./base.entity";

@Entity("payments")
export class PaymentEntity extends BaseEntity {
  @Index({ unique: true })
  @Column()
  orderId: string;

  @Column({ type: "varchar" })
  method: PaymentMethod;

  @Column({ type: "varchar", default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: "float" })
  amount: number;

  // Set only for COD's simulated internal reference. Nullable for online payments,
  // which use razorpayOrderId/razorpayPaymentId instead.
  @Column({ nullable: true })
  simulatedTxnRef?: string;

  // Plain unique index: standard SQL treats each NULL as distinct, so multiple
  // COD/not-yet-created rows can all be NULL here while non-null values stay unique.
  @Index({ unique: true })
  @Column({ nullable: true })
  razorpayOrderId?: string;

  @Column({ nullable: true })
  razorpayPaymentId?: string;

  // Canonical paise integer used for the Razorpay order and amount cross-checks.
  // Computed once at order-creation time; never re-derived from the float `amount`.
  @Column({ type: "int", nullable: true })
  amountPaise?: number;

  @Column({ type: "text", nullable: true })
  failureReason?: string;

  @Column({ nullable: true })
  verifiedAt?: Date;
}
