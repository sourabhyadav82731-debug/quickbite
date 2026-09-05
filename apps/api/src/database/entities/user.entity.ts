import { Column, Entity, Index } from "typeorm";
import { UserRole } from "@quickbite/types";
import { BaseEntity } from "./base.entity";

@Entity("users")
export class UserEntity extends BaseEntity {
  @Column()
  name: string;

  @Index({ unique: true })
  @Column()
  email: string;

  @Column({ select: false })
  passwordHash: string;

  // Normalized to canonical "+91XXXXXXXXXX" form so a number can never be
  // stored two different ways and become two different identities. Unique
  // but nullable: Postgres treats multiple NULLs as distinct under a unique
  // index, so accounts with no phone on file don't collide with each other.
  // Login is by email+password; this stays available for profile display
  // and any other feature that needs a verified contact number.
  @Index({ unique: true })
  @Column({ nullable: true })
  phone?: string;

  @Column({ type: "varchar" })
  role: UserRole;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ type: "float", default: 0 })
  walletBalance: number;

  // Account-level suspension, distinct from RestaurantEntity.status (which
  // is about the restaurant's own approval/operating state, not its owner's
  // login access). Used uniformly for customer/restaurant-owner/driver
  // accounts by the admin control center; a suspended account still exists
  // (never deleted) but is rejected at login — see AuthService.login.
  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true, select: false })
  refreshTokenHash?: string;
}
