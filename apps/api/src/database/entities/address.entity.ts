import { Column, Entity, Index } from "typeorm";
import { AddressLabel } from "@quickbite/types";
import { BaseEntity } from "./base.entity";

@Entity("addresses")
export class AddressEntity extends BaseEntity {
  @Index()
  @Column()
  userId: string;

  @Column({ type: "varchar" })
  label: AddressLabel;

  @Column()
  line1: string;

  @Column({ nullable: true })
  line2?: string;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column()
  pincode: string;

  @Column({ type: "float" })
  lat: number;

  @Column({ type: "float" })
  lng: number;

  @Column({ default: false })
  isDefault: boolean;
}
