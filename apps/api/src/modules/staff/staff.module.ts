import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RestaurantEntity, StaffEntity } from "../../database/entities";
import { StaffController } from "./staff.controller";
import { StaffService } from "./staff.service";

@Module({
  imports: [TypeOrmModule.forFeature([StaffEntity, RestaurantEntity])],
  controllers: [StaffController],
  providers: [StaffService],
})
export class StaffModule {}
