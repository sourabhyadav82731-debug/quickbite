import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserRole } from "@quickbite/types";
import { staffCreateSchema, staffUpdateSchema } from "@quickbite/validation";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthUser, CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { StaffService } from "./staff.service";

@ApiTags("staff")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
@Controller("staff")
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Get()
  list(@Query("restaurantId") restaurantId: string, @CurrentUser() user: AuthUser) {
    return this.staff.list(restaurantId, user as any);
  }

  @Post()
  invite(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(staffCreateSchema)) body: ReturnType<typeof staffCreateSchema.parse>,
  ) {
    return this.staff.invite(user as any, body);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(staffUpdateSchema)) body: ReturnType<typeof staffUpdateSchema.parse>,
  ) {
    return this.staff.update(id, user as any, body);
  }
}
