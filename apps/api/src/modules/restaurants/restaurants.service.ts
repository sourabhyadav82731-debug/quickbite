import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserRole } from "@quickbite/types";
import {
  AddonEntity,
  AddonGroupEntity,
  DishEntity,
  MenuCategoryEntity,
  RestaurantEntity,
} from "../../database/entities";

@Injectable()
export class RestaurantsService {
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

  async list(search?: string) {
    const qb = this.restaurants.createQueryBuilder("r");
    if (search) {
      qb.where("r.name LIKE :s OR r.cuisines LIKE :s", { s: `%${search}%` });
    }
    return qb.orderBy("r.rating", "DESC").getMany();
  }

  async get(id: string) {
    const restaurant = await this.restaurants.findOne({ where: { id } });
    if (!restaurant) throw new NotFoundException("Restaurant not found");
    return restaurant;
  }

  async getMenu(restaurantId: string) {
    await this.get(restaurantId);
    const categories = await this.categories.find({
      where: { restaurantId },
      order: { sortOrder: "ASC" },
    });
    const dishes = await this.dishes.find({ where: { restaurantId } });
    const dishIds = dishes.map((d) => d.id);
    const groups = dishIds.length
      ? await this.addonGroups
          .createQueryBuilder("g")
          .where("g.dishId IN (:...ids)", { ids: dishIds })
          .getMany()
      : [];
    const groupIds = groups.map((g) => g.id);
    const allAddons = groupIds.length
      ? await this.addons
          .createQueryBuilder("a")
          .where("a.addonGroupId IN (:...ids)", { ids: groupIds })
          .getMany()
      : [];

    return categories.map((category) => ({
      ...category,
      dishes: dishes
        .filter((d) => d.categoryId === category.id)
        .map((dish) => ({
          ...dish,
          addonGroups: groups
            .filter((g) => g.dishId === dish.id)
            .map((g) => ({
              ...g,
              addons: allAddons.filter((a) => a.addonGroupId === g.id),
            })),
        })),
    }));
  }

  async createForOwner(ownerId: string, input: Record<string, unknown>) {
    return this.restaurants.save(
      this.restaurants.create({ ...input, ownerId } as Partial<RestaurantEntity>),
    );
  }

  async listMine(ownerId: string) {
    return this.restaurants.find({ where: { ownerId } });
  }

  async update(
    id: string,
    actor: { userId: string; role: UserRole },
    patch: Partial<RestaurantEntity>,
  ) {
    const restaurant = await this.get(id);
    if (restaurant.ownerId !== actor.userId && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Not your restaurant");
    }
    await this.restaurants.update(id, patch);
    return this.get(id);
  }
}
