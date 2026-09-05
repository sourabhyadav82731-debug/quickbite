import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OrderStatus } from "@quickbite/types";
import { OrderStatusHistoryEntity } from "../../database/entities";

export type HistoryActorType = "SYSTEM" | "CUSTOMER" | "RESTAURANT" | "DRIVER" | "ADMIN";

@Injectable()
export class OrderHistoryService {
  constructor(
    @InjectRepository(OrderStatusHistoryEntity)
    private readonly history: Repository<OrderStatusHistoryEntity>,
  ) {}

  /** Fire-and-forget from the caller's perspective conceptually, but always
   *  awaited — an order transition and its audit row are written in the same
   *  request, never queued/best-effort, since this table's whole purpose is
   *  being a trustworthy record of what happened and when. */
  async record(
    orderId: string,
    status: OrderStatus,
    actorType: HistoryActorType,
    actorId?: string,
    note?: string,
  ) {
    await this.history.save(
      this.history.create({
        orderId,
        status,
        actorType,
        actorId,
        note,
        occurredAt: new Date().toISOString(),
      }),
    );
  }

  /** Chronological, oldest first — a timeline reads top-to-bottom as "what
   *  happened, in order", not newest-first like a feed. */
  async forOrder(orderId: string) {
    const rows = await this.history.find({ where: { orderId } });
    return rows.sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
  }
}
