import { Controller, ForbiddenException, Get, Module, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OrderStatus, UserRole } from "@quickbite/types";
import { OrderEntity, RestaurantEntity } from "../../database/entities";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AuthUser, CurrentUser } from "../../common/decorators/current-user.decorator";

// Settlement/payout scheduling and bank transfer integration is out of scope for the
// thin scaffold. This computes a mock ledger from delivered orders on the fly.
@ApiTags("payouts")
@UseGuards(JwtAuthGuard)
@Controller("payouts")
export class PayoutsController {
  constructor(
    @InjectRepository(OrderEntity) private readonly orders: Repository<OrderEntity>,
    @InjectRepository(RestaurantEntity)
    private readonly restaurants: Repository<RestaurantEntity>,
  ) {}

  @Get("restaurant")
  async forRestaurant(
    @Query("restaurantId") restaurantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const restaurant = await this.restaurants.findOne({ where: { id: restaurantId } });
    // restaurantId is caller-supplied — without this check any authenticated
    // restaurant owner could read another restaurant's settlement figures by
    // passing a different id. WithdrawalsService's own restaurant balance
    // calc mirrors this ownership check independently (it doesn't call this
    // endpoint), so this fix doesn't affect withdrawal correctness — only
    // this endpoint's own pre-existing gap.
    if (restaurant && restaurant.ownerId !== user.userId && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Not your restaurant");
    }
    const delivered = await this.orders.find({
      where: { restaurantId, status: OrderStatus.DELIVERED },
    });
    const gross = delivered.reduce((sum, o) => sum + o.itemTotal, 0);
    const commissionRate = restaurant?.commissionRate ?? 0.18;
    const commission = gross * commissionRate;
    return {
      ordersSettled: delivered.length,
      grossSales: gross,
      commissionRate,
      commissionDeducted: commission,
      netPayout: gross - commission,
      nextSettlementDate: null,
    };
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity, RestaurantEntity])],
  controllers: [PayoutsController],
})
export class PayoutsModule {}
