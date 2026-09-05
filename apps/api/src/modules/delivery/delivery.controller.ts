import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserRole } from "@quickbite/types";
import { deliveryLocationUpdateSchema, deliveryStageAdvanceSchema } from "@quickbite/validation";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthUser, CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { DeliveryService } from "./delivery.service";

@ApiTags("delivery")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DELIVERY_PARTNER)
@Controller()
export class DeliveryController {
  constructor(private readonly delivery: DeliveryService) {}

  // Accessible to any authenticated role so customers can track their order
  // and admins can inspect a delivery; overrides the class-level role guard.
  // pickupOtp is always redacted; dropOtp is redacted for everyone except
  // the customer themselves — see getByOrderIdEnriched.
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.RESTAURANT_OWNER, UserRole.DELIVERY_PARTNER)
  @Get("deliveries/order/:orderId")
  byOrder(@Param("orderId") orderId: string, @CurrentUser() user: AuthUser) {
    return this.delivery.getByOrderIdEnriched(orderId, user as any);
  }

  // Restaurant dashboard's "Active Deliveries" — ownership-checked in the
  // service (restaurantId is caller-supplied).
  @Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
  @Get("deliveries/restaurant/:restaurantId/active")
  activeForRestaurant(
    @Param("restaurantId") restaurantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.delivery.listActiveForRestaurant(restaurantId, user as any);
  }

  // Restaurant/admin-only — the sole path that ever returns the real pickup
  // OTP value. Idempotent: returns the existing OTP if one was already issued.
  @Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
  @Post("deliveries/order/:orderId/pickup-otp")
  generatePickupOtp(@Param("orderId") orderId: string, @CurrentUser() user: AuthUser) {
    return this.delivery.getPickupOtpForOrder(orderId, user as any);
  }

  @Get("deliveries/active")
  active(@CurrentUser() user: AuthUser) {
    return this.delivery.listActiveForDriver(user.userId);
  }

  @Get("deliveries/history")
  history(@CurrentUser() user: AuthUser) {
    return this.delivery.listHistoryForDriver(user.userId);
  }

  @Post("deliveries/:id/respond")
  respond(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body("accept") accept: boolean,
  ) {
    return this.delivery.respondToOffer(id, user.userId, accept);
  }

  @Post("deliveries/:id/advance")
  advance(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(deliveryStageAdvanceSchema))
    body: ReturnType<typeof deliveryStageAdvanceSchema.parse>,
  ) {
    return this.delivery.advanceStage(id, user.userId, body.stage, body.otp);
  }

  @Post("deliveries/:id/location")
  location(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(deliveryLocationUpdateSchema))
    body: ReturnType<typeof deliveryLocationUpdateSchema.parse>,
  ) {
    return this.delivery.updateLocation(id, user.userId, body.lat, body.lng);
  }

  @Patch("drivers/me/status")
  setStatus(@CurrentUser() user: AuthUser, @Body("isOnline") isOnline: boolean) {
    return this.delivery.setOnline(user.userId, isOnline);
  }

  @Get("drivers/me")
  me(@CurrentUser() user: AuthUser) {
    return this.delivery.myProfile(user.userId);
  }

  @Get("drivers/me/earnings")
  earnings(@CurrentUser() user: AuthUser) {
    return this.delivery.earnings(user.userId);
  }
}
