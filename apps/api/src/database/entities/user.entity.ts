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

  @Column({ nullable: true })
  phone?: string;

  @Column({ type: "varchar" })
  role: UserRole;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ type: "float", default: 0 })
  walletBalance: number;

  @Column({ nullable: true, select: false })
  refreshTokenHash?: string;
}
