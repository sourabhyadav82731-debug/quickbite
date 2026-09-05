import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserRole, WithdrawalStatus } from "@quickbite/types";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthUser, CurrentUser } from "../../common/decorators/current-user.decorator";
import { WithdrawalsService } from "./withdrawals.service";

@ApiTags("withdrawals")
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("withdrawals")
export class WithdrawalsController {
  constructor(private readonly withdrawals: WithdrawalsService) {}

  @Roles(UserRole.DELIVERY_PARTNER)
  @Get("driver/balance")
  driverBalance(@CurrentUser() user: AuthUser) {
    return this.withdrawals.driverBalance(user.userId);
  }

  @Roles(UserRole.DELIVERY_PARTNER)
  @Post("driver")
  requestDriverWithdrawal(
    @CurrentUser() user: AuthUser,
    @Body("amount") amount: number,
    @Body("payoutMethod") payoutMethod: string,
  ) {
    return this.withdrawals.requestDriverWithdrawal(user.userId, Number(amount), payoutMethod);
  }

  @Roles(UserRole.DELIVERY_PARTNER)
  @Get("driver/history")
  driverHistory(@CurrentUser() user: AuthUser) {
    return this.withdrawals.driverHistory(user.userId);
  }

  @Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
  @Get("restaurant/balance")
  restaurantBalance(@Query("restaurantId") restaurantId: string, @CurrentUser() user: AuthUser) {
    return this.withdrawals.restaurantBalance(restaurantId, user as any);
  }

  @Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
  @Post("restaurant")
  requestRestaurantWithdrawal(
    @CurrentUser() user: AuthUser,
    @Body("restaurantId") restaurantId: string,
    @Body("amount") amount: number,
    @Body("payoutMethod") payoutMethod: string,
  ) {
    return this.withdrawals.requestRestaurantWithdrawal(
      restaurantId,
      user as any,
      Number(amount),
      payoutMethod,
    );
  }

  @Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
  @Get("restaurant/history")
  restaurantHistory(@Query("restaurantId") restaurantId: string, @CurrentUser() user: AuthUser) {
    return this.withdrawals.restaurantHistory(restaurantId, user as any);
  }

  @Roles(UserRole.ADMIN)
  @Get()
  adminList() {
    return this.withdrawals.adminList();
  }

  @Roles(UserRole.ADMIN)
  @Patch(":id/status")
  adminUpdateStatus(
    @Param("id") id: string,
    @Body("status") status: WithdrawalStatus,
    @Body("referenceId") referenceId?: string,
    @Body("failureReason") failureReason?: string,
  ) {
    return this.withdrawals.adminUpdateStatus(id, status, referenceId, failureReason);
  }
}
