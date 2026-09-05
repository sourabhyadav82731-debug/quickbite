import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserRole } from "@quickbite/types";
import { couponSchema, couponUpdateSchema } from "@quickbite/validation";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthUser, CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { CouponsService } from "./coupons.service";

@ApiTags("coupons")
@Controller("coupons")
export class CouponsController {
  constructor(private readonly coupons: CouponsService) {}

  @Get()
  list() {
    return this.coupons.list();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
  @Get("mine")
  listMine(@Query("restaurantId") restaurantId: string, @CurrentUser() user: AuthUser) {
    return this.coupons.listMine(restaurantId, user as any);
  }

  @UseGuards(JwtAuthGuard)
  @Post("validate")
  validate(
    @Body("code") code: string,
    @Body("orderValue") orderValue: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.coupons.validate(code, orderValue, user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
  @Post()
  create(
    @Body(new ZodValidationPipe(couponSchema)) body: ReturnType<typeof couponSchema.parse>,
    @CurrentUser() user: AuthUser,
  ) {
    return this.coupons.create(body, user as any);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
  @Patch(":id")
  update(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(couponUpdateSchema))
    body: ReturnType<typeof couponUpdateSchema.parse>,
  ) {
    return this.coupons.update(id, user as any, body);
  }
}
