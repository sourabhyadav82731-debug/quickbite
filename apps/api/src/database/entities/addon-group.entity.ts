import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity("addon_groups")
export class AddonGroupEntity extends BaseEntity {
  @Index()
  @Column()
  dishId: string;

  @Column()
  name: string;

  @Column({ default: false })
  isRequired: boolean;

  @Column({ type: "int", default: 0 })
  minSelect: number;

  @Column({ type: "int", default: 1 })
  maxSelect: number;
}
