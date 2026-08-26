import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { RestaurantsModule } from "./modules/restaurants/restaurants.module";
import { MenuModule } from "./modules/menu/menu.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { DeliveryModule } from "./modules/delivery/delivery.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { CouponsModule } from "./modules/coupons/coupons.module";
import { ReviewsModule } from "./modules/reviews/reviews.module";
import { PayoutsModule } from "./modules/payouts/payouts.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { AdminModule } from "./modules/admin/admin.module";
import { AiModule } from "./modules/ai/ai.module";
import { WebsocketModule } from "./modules/websocket/websocket.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    WebsocketModule,
    AuthModule,
    UsersModule,
    RestaurantsModule,
    MenuModule,
    OrdersModule,
    DeliveryModule,
    PaymentsModule,
    CouponsModule,
    ReviewsModule,
    PayoutsModule,
    NotificationsModule,
    AdminModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
