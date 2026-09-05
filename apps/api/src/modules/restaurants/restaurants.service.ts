import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RestaurantAvailabilityStatus, UserRole } from "@quickbite/types";
import { RestaurantAvailabilityInput, RestaurantHolidayInput } from "@quickbite/validation";
import {
  AddonEntity,
  AddonGroupEntity,
  DishEntity,
  MenuCategoryEntity,
  RestaurantEntity,
  RestaurantHolidayEntity,
} from "../../database/entities";

// "YYYY-MM-DD" in the server's local time zone — matches the plain-string
// date format restaurant_holidays.date is stored in.
function todayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

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
    @InjectRepository(RestaurantHolidayEntity)
    private readonly holidays: Repository<RestaurantHolidayEntity>,
  ) {}

  async list(search?: string) {
    const qb = this.restaurants.createQueryBuilder("r");
    if (search) {
      // LOWER(...) LIKE on both sides (rather than ILIKE) so this stays portable:
      // SQLite has no ILIKE operator at all, while plain LIKE is case-sensitive on
      // Postgres but not on SQLite — this normalizes both to the same behavior.
      qb.where("LOWER(r.name) LIKE LOWER(:s) OR LOWER(r.cuisines) LIKE LOWER(:s)", {
        s: `%${search}%`,
      });
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
          // Server-resolved customer-facing price — callers (customer app) must
          // display this as-is rather than recomputing the fallback themselves.
          sellingPrice: dish.customerPrice ?? dish.discountPrice ?? dish.price,
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

  // `patch` here has already been through restaurantUpdateSchema at the
  // controller for non-admin callers (Zod strips unknown keys by default),
  // so commissionRate/status/rating/ratingCount/ownerId can never reach this
  // .update() call from a restaurant owner — only admin may pass an
  // unrestricted patch, matching its existing approve/suspend responsibilities.
  async update(
    id: string,
    actor: { userId: string; role: UserRole },
    patch: Record<string, unknown>,
  ) {
    const restaurant = await this.get(id);
    if (restaurant.ownerId !== actor.userId && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Not your restaurant");
    }
    await this.restaurants.update(id, patch as Partial<RestaurantEntity>);
    return this.get(id);
  }

  async setAvailability(
    id: string,
    actor: { userId: string; role: UserRole },
    input: RestaurantAvailabilityInput,
  ) {
    const restaurant = await this.get(id);
    if (restaurant.ownerId !== actor.userId && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Not your restaurant");
    }
    await this.restaurants.update(id, {
      availabilityStatus: input.availabilityStatus,
      // Explicit null (not undefined) when leaving PAUSED — TypeORM's
      // .update() omits an undefined property from the SQL entirely, which
      // would leave a stale pause reason sitting on the row after resuming.
      // The entity's own `?: string` TS type doesn't include null even
      // though the column is nullable, hence the cast.
      pauseReason: (input.availabilityStatus === RestaurantAvailabilityStatus.PAUSED
        ? input.pauseReason
        : null) as string | undefined,
      // Kept in sync so every pre-existing isAcceptingOrders read path
      // (customer discover-page filtering, etc.) reflects the new status too.
      isAcceptingOrders: input.availabilityStatus === RestaurantAvailabilityStatus.OPEN,
    });
    return this.get(id);
  }

  /** The single source of truth for "can this restaurant take an order right
   *  now" — used by both checkout enforcement and customer-facing display, so
   *  the two can never disagree. A holiday always wins regardless of
   *  availabilityStatus, matching "Restaurant should automatically appear
   *  CLOSED during configured holidays." */
  async isOpenNow(restaurant: RestaurantEntity): Promise<{ open: boolean; reason?: string }> {
    if (restaurant.availabilityStatus !== RestaurantAvailabilityStatus.OPEN) {
      return {
        open: false,
        reason: restaurant.availabilityStatus === RestaurantAvailabilityStatus.PAUSED
          ? restaurant.pauseReason ?? "Temporarily paused"
          : "Closed",
      };
    }
    const holiday = await this.holidays.findOne({
      where: { restaurantId: restaurant.id, date: todayDateString() },
    });
    if (holiday) {
      return { open: false, reason: holiday.label };
    }
    return { open: true };
  }

  async listHolidays(restaurantId: string) {
    return this.holidays.find({ where: { restaurantId }, order: { date: "ASC" } });
  }

  async addHoliday(
    restaurantId: string,
    actor: { userId: string; role: UserRole },
    input: RestaurantHolidayInput,
  ) {
    const restaurant = await this.get(restaurantId);
    if (restaurant.ownerId !== actor.userId && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Not your restaurant");
    }
    return this.holidays.save(this.holidays.create({ restaurantId, ...input }));
  }

  async deleteHoliday(
    restaurantId: string,
    holidayId: string,
    actor: { userId: string; role: UserRole },
  ) {
    const restaurant = await this.get(restaurantId);
    if (restaurant.ownerId !== actor.userId && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Not your restaurant");
    }
    const holiday = await this.holidays.findOne({ where: { id: holidayId, restaurantId } });
    if (!holiday) throw new NotFoundException("Holiday not found");
    await this.holidays.delete(holidayId);
    return { success: true };
  }
}
