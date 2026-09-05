import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
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

  async updateCategory(
    categoryId: string,
    actor: { userId: string; role: UserRole },
    patch: { name?: string; sortOrder?: number },
  ) {
    const category = await this.categories.findOne({ where: { id: categoryId } });
    if (!category) throw new NotFoundException("Category not found");
    await this.assertOwnership(category.restaurantId, actor);
    await this.categories.update(categoryId, patch);
    return this.categories.findOne({ where: { id: categoryId } });
  }

  // "Delete where safe" — a category with dishes in it must be emptied or
  // have them moved first, never silently deleted along with (or orphaning)
  // its dishes.
  async deleteCategory(categoryId: string, actor: { userId: string; role: UserRole }) {
    const category = await this.categories.findOne({ where: { id: categoryId } });
    if (!category) throw new NotFoundException("Category not found");
    await this.assertOwnership(category.restaurantId, actor);
    const dishCount = await this.dishes.count({ where: { categoryId } });
    if (dishCount > 0) {
      throw new ForbiddenException(
        `Cannot delete "${category.name}" — it still has ${dishCount} dish(es). Move or delete them first.`,
      );
    }
    await this.categories.delete(categoryId);
    return { success: true };
  }

  async reorderCategories(
    restaurantId: string,
    actor: { userId: string; role: UserRole },
    orderedIds: string[],
  ) {
    await this.assertOwnership(restaurantId, actor);
    const categories = await this.categories.find({ where: { restaurantId } });
    const idSet = new Set(categories.map((c) => c.id));
    // Every id must belong to this restaurant — silently accepting a
    // foreign id would let an owner reorder rows that overlap with (but
    // aren't necessarily limited to) another restaurant's categories.
    if (orderedIds.length !== categories.length || !orderedIds.every((id) => idSet.has(id))) {
      throw new ForbiddenException("orderedIds must be exactly this restaurant's own category ids");
    }
    await Promise.all(orderedIds.map((id, i) => this.categories.update(id, { sortOrder: i })));
    return this.categories.find({ where: { restaurantId }, order: { sortOrder: "ASC" } });
  }

  async createDish(
    restaurantId: string,
    actor: { userId: string; role: UserRole },
    input: DishInput,
  ) {
    await this.assertOwnership(restaurantId, actor);
    this.assertCanSetCustomerPrice(input, actor);
    return this.dishes.save(this.dishes.create({ ...input, restaurantId }));
  }

  async updateDish(
    dishId: string,
    actor: { userId: string; role: UserRole },
    patch: Partial<DishEntity>,
  ) {
    const dish = await this.dishOwner(dishId);
    await this.assertOwnership(dish.restaurantId, actor);
    this.assertCanSetCustomerPrice(patch, actor);
    await this.dishes.update(dishId, patch);
    return this.dishes.findOne({ where: { id: dishId } });
  }

  // Safe to delete outright — OrderItemEntity stores its own nameSnapshot/
  // price snapshots and has no foreign-key dependency on the dish still
  // existing, so past orders/receipts are unaffected either way. Disabling
  // via isInStock remains the reversible option; this is the permanent one.
  async deleteDish(dishId: string, actor: { userId: string; role: UserRole }) {
    const dish = await this.dishOwner(dishId);
    await this.assertOwnership(dish.restaurantId, actor);
    const groups = await this.addonGroups.find({ where: { dishId } });
    if (groups.length) {
      await this.addons.delete({ addonGroupId: In(groups.map((g) => g.id)) });
      await this.addonGroups.delete({ dishId });
    }
    await this.dishes.delete(dishId);
    return { success: true };
  }

  // customerPrice is the platform's markup/selling-price decision, not the
  // restaurant's own price — restaurant owners may only ever set `price`
  // (their base/cost price) and `discountPrice`, never customerPrice.
  private assertCanSetCustomerPrice(
    input: Record<string, unknown>,
    actor: { userId: string; role: UserRole },
  ) {
    if (input.customerPrice !== undefined && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Only admin can set the customer-facing price");
    }
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
