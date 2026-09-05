import { Column, Entity, Index } from "typeorm";
import { WithdrawalOwnerType, WithdrawalStatus } from "@quickbite/types";
import { BaseEntity } from "./base.entity";

/** A withdrawal request against either a driver's or a restaurant's wallet.
 *  `ownerId` is the driver's userId when ownerType is DRIVER, or the
 *  restaurantId when ownerType is RESTAURANT — the two wallets never share an
 *  id space, and every query in WithdrawalsService filters on both fields
 *  together so a driver's rows and a restaurant's rows can never cross. No
 *  real payout provider exists in this scaffold (see WithdrawalsService), so
 *  COMPLETED is only ever reached via an explicit admin action confirming the
 *  transfer happened out-of-band — never automatically. */
@Entity("withdrawal_requests")
export class WithdrawalRequestEntity extends BaseEntity {
  @Index()
  @Column({ type: "varchar" })
  ownerType: WithdrawalOwnerType;

  @Index()
  @Column()
  ownerId: string;

  @Column({ type: "float" })
  amount: number;

  @Column()
  payoutMethod: string;

  @Column({ type: "varchar", default: WithdrawalStatus.PENDING })
  status: WithdrawalStatus;

  @Column({ nullable: true })
  referenceId?: string;

  @Column({ type: "text", nullable: true })
  failureReason?: string;

  // ISO string, matching the existing offerExpiresAt-style pattern elsewhere in
  // this codebase (DeliveryEntity) rather than a typed date column — keeps this
  // portable across the sqlite (dev) / postgres (prod) split with no driver-
  // specific date handling.
  @Column({ nullable: true })
  processedAt?: string;
}
