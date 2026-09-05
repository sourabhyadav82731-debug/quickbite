import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DeliveryEntity, OrderEntity, RestaurantEntity } from "../../database/entities";
import { OrdersGateway } from "./orders.gateway";
import { DeliveryGateway } from "./delivery.gateway";
import { RealtimeEmitterService } from "./realtime-emitter.service";

@Module({
  imports: [
    JwtModule.register({}),
    // Plain repository access for DeliveryGateway's own subscribe-authorization
    // check — deliberately not importing DeliveryModule/OrdersModule here,
    // which would create a cycle (both of those already import this module).
    TypeOrmModule.forFeature([OrderEntity, DeliveryEntity, RestaurantEntity]),
  ],
  providers: [OrdersGateway, DeliveryGateway, RealtimeEmitterService],
  exports: [RealtimeEmitterService],
})
export class WebsocketModule {}
