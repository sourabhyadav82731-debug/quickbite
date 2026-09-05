import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CouponEntity, OrderEntity, RestaurantEntity } from "../../database/entities";
import { CouponsController } from "./coupons.controller";
import { CouponsService } from "./coupons.service";

@Module({
  imports: [TypeOrmModule.forFeature([CouponEntity, RestaurantEntity, OrderEntity])],
  controllers: [CouponsController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
