import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { OrdersGateway } from "./orders.gateway";
import { DeliveryGateway } from "./delivery.gateway";
import { RealtimeEmitterService } from "./realtime-emitter.service";

@Module({
  imports: [JwtModule.register({})],
  providers: [OrdersGateway, DeliveryGateway, RealtimeEmitterService],
  exports: [RealtimeEmitterService],
})
export class WebsocketModule {}
