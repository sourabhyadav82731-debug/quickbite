import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  AuditLogEntity,
  DeliveryEntity,
  DriverProfileEntity,
  OrderEntity,
  RestaurantEntity,
  UserEntity,
} from "../../database/entities";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RestaurantEntity,
      OrderEntity,
      UserEntity,
      DriverProfileEntity,
      AuditLogEntity,
      DeliveryEntity,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
