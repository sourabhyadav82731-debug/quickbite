import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { OrderStatus, UserRole } from "@quickbite/types";
import { checkoutSchema, orderStatusUpdateSchema } from "@quickbite/validation";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthUser, CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { OrdersService } from "./orders.service";

@ApiTags("orders")
@UseGuards(JwtAuthGuard)
@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Roles(UserRole.CUSTOMER)
  @UseGuards(RolesGuard)
  @Post()
  checkout(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(checkoutSchema)) body: ReturnType<typeof checkoutSchema.parse>,
  ) {
    return this.orders.checkout(user.userId, body);
  }

  @Get()
  async list(@CurrentUser() user: AuthUser, @Query("restaurantId") restaurantId?: string) {
    if (user.role === UserRole.ADMIN) return this.orders.listAll();
    if (user.role === UserRole.RESTAURANT_OWNER && restaurantId) {
      return this.orders.listForRestaurant(restaurantId);
    }
    return this.orders.listForCustomer(user.userId);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.orders.get(id);
  }

  @Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(orderStatusUpdateSchema)) body: { status: OrderStatus; reason?: string },
  ) {
    return this.orders.updateStatus(id, user as any, body.status, body.reason);
  }

  @Post(":id/cancel")
  cancel(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body("reason") reason?: string,
  ) {
    return this.orders.cancel(id, user as any, reason);
  }
}
