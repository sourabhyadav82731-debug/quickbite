import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  AddonEntity,
  AddonGroupEntity,
  DishEntity,
  MenuCategoryEntity,
  RestaurantEntity,
} from "../../database/entities";
import { RestaurantsController } from "./restaurants.controller";
import { RestaurantsService } from "./restaurants.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RestaurantEntity,
      MenuCategoryEntity,
      DishEntity,
      AddonGroupEntity,
      AddonEntity,
    ]),
  ],
  controllers: [RestaurantsController],
  providers: [RestaurantsService],
  exports: [RestaurantsService],
})
export class RestaurantsModule {}
