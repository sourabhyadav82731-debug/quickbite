import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OrderStatus, UserRole } from "@quickbite/types";
import { checkoutSchema, orderStatusUpdateSchema } from "@quickbite/validation";
import { RestaurantEntity } from "../../database/entities";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthUser, CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { RefundsService } from "../refunds/refunds.service";
import { OrdersService } from "./orders.service";

@ApiTags("orders")
@UseGuards(JwtAuthGuard)
@Controller("orders")
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly refunds: RefundsService,
    @InjectRepository(RestaurantEntity)
    private readonly restaurants: Repository<RestaurantEntity>,
  ) {}

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
      // restaurantId is caller-supplied — without this, any restaurant owner
      // could read another restaurant's order list by passing a different id.
      const restaurant = await this.restaurants.findOne({ where: { id: restaurantId } });
      if (restaurant && restaurant.ownerId !== user.userId) {
        throw new ForbiddenException("Not your restaurant");
      }
      return this.orders.listForRestaurant(restaurantId);
    }
    return this.orders.listForCustomer(user.userId);
  }

  // orderId is caller-supplied and reachable by every role — scoped the same
  // way DeliveryService.getByOrderIdEnriched scopes its own by-order lookup.
  // Previously any authenticated user could read any other customer's order
  // (items, address, totals) just by knowing/guessing an order id.
  @Get(":id")
  async get(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    const order = await this.orders.get(id);
    if (user.role === UserRole.ADMIN) return order;
    if (user.role === UserRole.CUSTOMER) {
      if (order.customerId !== user.userId) throw new ForbiddenException("Not your order");
      return order;
    }
    if (user.role === UserRole.RESTAURANT_OWNER) {
      const restaurant = await this.restaurants.findOne({ where: { id: order.restaurantId } });
      if (restaurant?.ownerId !== user.userId) {
        throw new ForbiddenException("Not your restaurant's order");
      }
      return order;
    }
    // DELIVERY_PARTNER: only ever reachable through their own assigned
    // delivery, not by browsing arbitrary orders.
    throw new ForbiddenException("Not authorized for this order");
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

  @Post(":id/refund-request")
  requestRefund(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body("reason") reason: string,
  ) {
    return this.refunds.request(id, user as any, reason);
  }
}
