import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  AuditLogEntity,
  CouponEntity,
  DeliveryEntity,
  DriverProfileEntity,
  OrderEntity,
  OrderItemEntity,
  PaymentEntity,
  RefundEntity,
  ReviewEntity,
  OrderStatusHistoryEntity,
  RestaurantEntity,
  UserEntity,
  WithdrawalRequestEntity,
} from "../../database/entities";
import { OrderHistoryModule } from "../order-history/order-history.module";
import { RefundsModule } from "../refunds/refunds.module";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RestaurantEntity,
      OrderEntity,
      OrderItemEntity,
      PaymentEntity,
      UserEntity,
      DriverProfileEntity,
      AuditLogEntity,
      DeliveryEntity,
      RefundEntity,
      ReviewEntity,
      CouponEntity,
      WithdrawalRequestEntity,
      OrderStatusHistoryEntity,
    ]),
    OrderHistoryModule,
    RefundsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
