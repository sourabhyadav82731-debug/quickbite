import { Body, Controller, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserRole } from "@quickbite/types";
import { addonGroupSchema, dishSchema, menuCategorySchema } from "@quickbite/validation";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthUser, CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { MenuService } from "./menu.service";

@ApiTags("menu")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
@Controller()
export class MenuController {
  constructor(private readonly menu: MenuService) {}

  @Post("restaurants/:id/categories")
  createCategory(
    @Param("id") restaurantId: string,
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(menuCategorySchema)) body: ReturnType<typeof menuCategorySchema.parse>,
  ) {
    return this.menu.createCategory(restaurantId, user as any, body);
  }

  @Post("restaurants/:id/dishes")
  createDish(
    @Param("id") restaurantId: string,
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(dishSchema)) body: ReturnType<typeof dishSchema.parse>,
  ) {
    return this.menu.createDish(restaurantId, user as any, body);
  }

  @Patch("dishes/:id")
  updateDish(
    @Param("id") dishId: string,
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return this.menu.updateDish(dishId, user as any, body);
  }

  @Patch("dishes/:id/stock")
  toggleStock(
    @Param("id") dishId: string,
    @CurrentUser() user: AuthUser,
    @Body("isInStock") isInStock: boolean,
  ) {
    return this.menu.toggleStock(dishId, user as any, isInStock);
  }

  @Post("dishes/:id/addon-groups")
  createAddonGroup(
    @Param("id") dishId: string,
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(addonGroupSchema)) body: ReturnType<typeof addonGroupSchema.parse>,
  ) {
    return this.menu.createAddonGroup(dishId, user as any, body);
  }
}
