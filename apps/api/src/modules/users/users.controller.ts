import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { addressSchema } from "@quickbite/validation";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AuthUser, CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { UsersService } from "./users.service";

@ApiTags("users")
@UseGuards(JwtAuthGuard)
@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Patch("users/me")
  updateProfile(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.users.updateProfile(user.userId, body);
  }

  @Get("addresses")
  listAddresses(@CurrentUser() user: AuthUser) {
    return this.users.listAddresses(user.userId);
  }

  @Post("addresses")
  createAddress(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(addressSchema)) body: ReturnType<typeof addressSchema.parse>,
  ) {
    return this.users.createAddress(user.userId, body);
  }

  @Delete("addresses/:id")
  deleteAddress(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.users.deleteAddress(user.userId, id);
  }
}
