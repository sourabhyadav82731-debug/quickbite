import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CouponEntity, OrderEntity, PaymentEntity } from "../../database/entities";
import { WebsocketModule } from "../websocket/websocket.module";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { razorpayClientProvider } from "./razorpay.provider";

@Module({
  imports: [TypeOrmModule.forFeature([PaymentEntity, OrderEntity, CouponEntity]), WebsocketModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, razorpayClientProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}
