import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  CouponEntity,
  DishEntity,
  OrderEntity,
  OrderItemEntity,
  PaymentEntity,
  RestaurantEntity,
} from "../../database/entities";
import { WebsocketModule } from "../websocket/websocket.module";
import { DeliveryModule } from "../delivery/delivery.module";
import { PaymentsModule } from "../payments/payments.module";
import { RestaurantsModule } from "../restaurants/restaurants.module";
import { OrderHistoryModule } from "../order-history/order-history.module";
import { RefundsModule } from "../refunds/refunds.module";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderEntity,
      OrderItemEntity,
      PaymentEntity,
      DishEntity,
      RestaurantEntity,
      CouponEntity,
    ]),
    WebsocketModule,
    PaymentsModule,
    RestaurantsModule,
    OrderHistoryModule,
    RefundsModule,
    forwardRef(() => DeliveryModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
