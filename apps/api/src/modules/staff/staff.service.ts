import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserRole } from "@quickbite/types";
import { StaffCreateInput, StaffUpdateInput } from "@quickbite/validation";
import { RestaurantEntity, StaffEntity } from "../../database/entities";

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(StaffEntity) private readonly staff: Repository<StaffEntity>,
    @InjectRepository(RestaurantEntity)
    private readonly restaurants: Repository<RestaurantEntity>,
  ) {}

  private async assertOwnership(restaurantId: string, actor: { userId: string; role: UserRole }) {
    const restaurant = await this.restaurants.findOne({ where: { id: restaurantId } });
    if (!restaurant) throw new NotFoundException("Restaurant not found");
    if (restaurant.ownerId !== actor.userId && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Not your restaurant");
    }
    return restaurant;
  }

  async list(restaurantId: string, actor: { userId: string; role: UserRole }) {
    await this.assertOwnership(restaurantId, actor);
    return this.staff.find({ where: { restaurantId }, order: { createdAt: "DESC" } });
  }

  async invite(actor: { userId: string; role: UserRole }, input: StaffCreateInput) {
    await this.assertOwnership(input.restaurantId, actor);
    return this.staff.save(this.staff.create(input));
  }

  async update(
    staffId: string,
    actor: { userId: string; role: UserRole },
    patch: StaffUpdateInput,
  ) {
    const member = await this.staff.findOne({ where: { id: staffId } });
    if (!member) throw new NotFoundException("Staff member not found");
    await this.assertOwnership(member.restaurantId, actor);
    await this.staff.update(staffId, patch);
    return this.staff.findOne({ where: { id: staffId } });
  }
}
