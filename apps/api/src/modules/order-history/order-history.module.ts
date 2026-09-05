import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OrderStatusHistoryEntity } from "../../database/entities";
import { OrderHistoryService } from "./order-history.service";

// Deliberately dependency-free (only its own repository) so OrdersModule,
// DeliveryModule, and PaymentsModule can all import it without creating a
// cycle between each other.
@Module({
  imports: [TypeOrmModule.forFeature([OrderStatusHistoryEntity])],
  providers: [OrderHistoryService],
  exports: [OrderHistoryService],
})
export class OrderHistoryModule {}
