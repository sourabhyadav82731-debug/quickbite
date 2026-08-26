import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotificationEntity } from "../../database/entities";

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notifications: Repository<NotificationEntity>,
  ) {}

  list(userId: string) {
    return this.notifications.find({ where: { userId }, order: { createdAt: "DESC" } });
  }

  async markRead(userId: string, id: string) {
    await this.notifications.update({ id, userId }, { isRead: true });
    return { success: true };
  }
}
