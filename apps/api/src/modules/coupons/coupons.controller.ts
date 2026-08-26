import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserRole } from "@quickbite/types";
import { couponSchema } from "@quickbite/validation";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
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

  @Post("validate")
  validate(@Body("code") code: string, @Body("orderValue") orderValue: number) {
    return this.coupons.validate(code, orderValue);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
  @Post()
  create(@Body(new ZodValidationPipe(couponSchema)) body: ReturnType<typeof couponSchema.parse>) {
    return this.coupons.create(body);
  }
}
