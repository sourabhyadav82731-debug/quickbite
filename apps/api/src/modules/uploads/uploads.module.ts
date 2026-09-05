import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DishEntity, RestaurantEntity, RestaurantPhotoEntity, UserEntity } from "../../database/entities";
import { UploadsController } from "./uploads.controller";
import { UploadsService } from "./uploads.service";

@Module({
  imports: [TypeOrmModule.forFeature([RestaurantEntity, RestaurantPhotoEntity, DishEntity, UserEntity])],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
