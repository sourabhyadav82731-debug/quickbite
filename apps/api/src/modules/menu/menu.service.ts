import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserRole } from "@quickbite/types";
import { AddonGroupInput, DishInput, MenuCategoryInput } from "@quickbite/validation";
import {
  AddonEntity,
  AddonGroupEntity,
  DishEntity,
  MenuCategoryEntity,
  RestaurantEntity,
} from "../../database/entities";

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(RestaurantEntity)
    private readonly restaurants: Repository<RestaurantEntity>,
    @InjectRepository(MenuCategoryEntity)
    private readonly categories: Repository<MenuCategoryEntity>,
    @InjectRepository(DishEntity) private readonly dishes: Repository<DishEntity>,
    @InjectRepository(AddonGroupEntity)
    private readonly addonGroups: Repository<AddonGroupEntity>,
    @InjectRepository(AddonEntity) private readonly addons: Repository<AddonEntity>,
  ) {}

  private async assertOwnership(
    restaurantId: string,
    actor: { userId: string; role: UserRole },
  ) {
    const restaurant = await this.restaurants.findOne({ where: { id: restaurantId } });
    if (!restaurant) throw new NotFoundException("Restaurant not found");
    if (restaurant.ownerId !== actor.userId && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Not your restaurant");
    }
    return restaurant;
  }

  private async dishOwner(dishId: string) {
    const dish = await this.dishes.findOne({ where: { id: dishId } });
    if (!dish) throw new NotFoundException("Dish not found");
    return dish;
  }

  async createCategory(
    restaurantId: string,
    actor: { userId: string; role: UserRole },
    input: MenuCategoryInput,
  ) {
    await this.assertOwnership(restaurantId, actor);
    return this.categories.save(this.categories.create({ ...input, restaurantId }));
  }

  async createDish(
    restaurantId: string,
    actor: { userId: string; role: UserRole },
    input: DishInput,
  ) {
    await this.assertOwnership(restaurantId, actor);
    return this.dishes.save(this.dishes.create({ ...input, restaurantId }));
  }

  async updateDish(
    dishId: string,
    actor: { userId: string; role: UserRole },
    patch: Partial<DishEntity>,
  ) {
    const dish = await this.dishOwner(dishId);
    await this.assertOwnership(dish.restaurantId, actor);
    await this.dishes.update(dishId, patch);
    return this.dishes.findOne({ where: { id: dishId } });
  }

  async toggleStock(
    dishId: string,
    actor: { userId: string; role: UserRole },
    isInStock: boolean,
  ) {
    return this.updateDish(dishId, actor, { isInStock });
  }

  async createAddonGroup(
    dishId: string,
    actor: { userId: string; role: UserRole },
    input: AddonGroupInput,
  ) {
    const dish = await this.dishOwner(dishId);
    await this.assertOwnership(dish.restaurantId, actor);
    const group = await this.addonGroups.save(
      this.addonGroups.create({
        dishId,
        name: input.name,
        isRequired: input.isRequired,
        minSelect: input.minSelect,
        maxSelect: input.maxSelect,
      }),
    );
    if (input.addons?.length) {
      await this.addons.save(
        input.addons.map((a) =>
          this.addons.create({ addonGroupId: group.id, name: a.name, price: a.price }),
        ),
      );
    }
    return group;
  }
}
