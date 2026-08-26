import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DeliveryEntity, DriverProfileEntity, UserEntity } from "../../database/entities";
import { WebsocketModule } from "../websocket/websocket.module";
import { OrdersModule } from "../orders/orders.module";
import { DeliveryController } from "./delivery.controller";
import { DeliveryService } from "./delivery.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([DeliveryEntity, DriverProfileEntity, UserEntity]),
    WebsocketModule,
    forwardRef(() => OrdersModule),
  ],
  controllers: [DeliveryController],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
