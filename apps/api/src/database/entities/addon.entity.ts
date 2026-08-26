import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity("addons")
export class AddonEntity extends BaseEntity {
  @Index()
  @Column()
  addonGroupId: string;

  @Column()
  name: string;

  @Column({ type: "float", default: 0 })
  price: number;
}
