import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OrderEntity, RestaurantEntity, WithdrawalRequestEntity } from "../../database/entities";
import { DeliveryModule } from "../delivery/delivery.module";
import { WithdrawalsController } from "./withdrawals.controller";
import { WithdrawalsService } from "./withdrawals.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([WithdrawalRequestEntity, OrderEntity, RestaurantEntity]),
    DeliveryModule,
  ],
  controllers: [WithdrawalsController],
  providers: [WithdrawalsService],
})
export class WithdrawalsModule {}
