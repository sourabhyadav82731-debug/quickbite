import { Column, Entity, Index } from "typeorm";
import { NotificationType } from "@quickbite/types";
import { BaseEntity } from "./base.entity";

@Entity("notifications")
export class NotificationEntity extends BaseEntity {
  @Index()
  @Column()
  userId: string;

  @Column({ type: "varchar" })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: "text" })
  body: string;

  @Column({ default: false })
  isRead: boolean;
}
