import { Column, Entity, Index } from "typeorm";
import { StaffRole } from "@quickbite/types";
import { BaseEntity } from "./base.entity";

// A directory/roster the owner manages — not a parallel login system. This
// codebase's auth model has exactly 4 roles (customer/restaurant_owner/
// delivery_partner/admin) with no staff-login concept anywhere; building a
// second authentication system with its own permission checks across every
// restaurant endpoint is a much larger, separate piece of work than "manage
// staff according to the existing authorization model" asks for. A roster
// entry here can never act on anything by itself — it has no credentials, no
// JWT, no session — so it is, by construction, never granted owner-level
// (or any) permission automatically.
@Entity("staff")
export class StaffEntity extends BaseEntity {
  @Index()
  @Column()
  restaurantId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ type: "varchar" })
  role: StaffRole;

  @Column({ default: true })
  isActive: boolean;
}
