import { Body, Controller, Delete, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserRole } from "@quickbite/types";
import {
  addonGroupSchema,
  dishSchema,
  menuCategorySchema,
  menuCategoryUpdateSchema,
} from "@quickbite/validation";
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

  @Patch("categories/:id")
  updateCategory(
    @Param("id") categoryId: string,
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(menuCategoryUpdateSchema))
    body: ReturnType<typeof menuCategoryUpdateSchema.parse>,
  ) {
    return this.menu.updateCategory(categoryId, user as any, body);
  }

  @Delete("categories/:id")
  deleteCategory(@Param("id") categoryId: string, @CurrentUser() user: AuthUser) {
    return this.menu.deleteCategory(categoryId, user as any);
  }

  @Post("restaurants/:id/categories/reorder")
  reorderCategories(
    @Param("id") restaurantId: string,
    @CurrentUser() user: AuthUser,
    @Body("orderedIds") orderedIds: string[],
  ) {
    return this.menu.reorderCategories(restaurantId, user as any, orderedIds);
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

  @Delete("dishes/:id")
  deleteDish(@Param("id") dishId: string, @CurrentUser() user: AuthUser) {
    return this.menu.deleteDish(dishId, user as any);
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
