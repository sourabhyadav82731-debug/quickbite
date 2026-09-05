import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserRole } from "@quickbite/types";
import {
  restaurantAvailabilitySchema,
  restaurantHolidaySchema,
  restaurantUpdateSchema,
} from "@quickbite/validation";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthUser, CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { RestaurantsService } from "./restaurants.service";

@ApiTags("restaurants")
@Controller("restaurants")
export class RestaurantsController {
  constructor(private readonly restaurants: RestaurantsService) {}

  @Get()
  list(@Query("search") search?: string) {
    return this.restaurants.list(search);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER)
  @Get("mine")
  listMine(@CurrentUser() user: AuthUser) {
    return this.restaurants.listMine(user.userId);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.restaurants.get(id);
  }

  @Get(":id/menu")
  getMenu(@Param("id") id: string) {
    return this.restaurants.getMenu(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.restaurants.createForOwner(user.userId, body);
  }

  // Admin keeps an unrestricted patch body (needed for approve/suspend and
  // any other admin-only field) — only a non-admin caller's body is forced
  // through the owner-editable whitelist, since Zod's default behavior
  // (strip unknown keys) is what actually closes the gap this endpoint used
  // to have (commissionRate/status/rating/ownerId were all previously
  // settable by any restaurant owner via this same route).
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
  @Patch(":id")
  update(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    // Zod's `.nullable()` (used for a couple of clearable fields) is a wider
    // type than the entity's own `?: string` TS declaration — TypeORM's
    // .update() accepts `null` fine at runtime for a nullable column
    // regardless, so this is purely a compile-time widening, not a behavior
    // change.
    const patch = (
      user.role === UserRole.ADMIN ? body : restaurantUpdateSchema.parse(body)
    ) as Record<string, unknown>;
    return this.restaurants.update(id, user as any, patch);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
  @Patch(":id/availability")
  setAvailability(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(restaurantAvailabilitySchema))
    body: ReturnType<typeof restaurantAvailabilitySchema.parse>,
  ) {
    return this.restaurants.setAvailability(id, user as any, body);
  }

  // Public — the customer-facing "why is this restaurant closed" banner
  // needs the same answer without requiring auth.
  @Get(":id/availability")
  async getAvailability(@Param("id") id: string) {
    const restaurant = await this.restaurants.get(id);
    return this.restaurants.isOpenNow(restaurant);
  }

  @Get(":id/holidays")
  listHolidays(@Param("id") id: string) {
    return this.restaurants.listHolidays(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
  @Post(":id/holidays")
  addHoliday(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(restaurantHolidaySchema))
    body: ReturnType<typeof restaurantHolidaySchema.parse>,
  ) {
    return this.restaurants.addHoliday(id, user as any, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
  @Delete(":id/holidays/:holidayId")
  deleteHoliday(
    @Param("id") id: string,
    @Param("holidayId") holidayId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.restaurants.deleteHoliday(id, holidayId, user as any);
  }
}
