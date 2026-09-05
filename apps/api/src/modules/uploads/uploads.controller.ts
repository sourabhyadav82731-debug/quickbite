import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags } from "@nestjs/swagger";
import { UserRole } from "@quickbite/types";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthUser, CurrentUser } from "../../common/decorators/current-user.decorator";
import { multerOptionsFor } from "./multer.config";
import { UploadsService } from "./uploads.service";

// Only the mutating routes are guarded/owner-checked (matching
// RestaurantsController's own pattern) — the gallery listing is public, same
// as restaurant/menu detail, since customers need to see the photos too.
@ApiTags("uploads")
@Controller()
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
  @Post("restaurants/:id/photos/cover")
  @UseInterceptors(FileInterceptor("file", multerOptionsFor("restaurants")))
  setCover(
    @Param("id") restaurantId: string,
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploads.setCoverPhoto(restaurantId, user as any, file);
  }

  @Get("restaurants/:id/photos")
  list(@Param("id") restaurantId: string) {
    return this.uploads.listGalleryPhotos(restaurantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
  @Post("restaurants/:id/photos")
  @UseInterceptors(FileInterceptor("file", multerOptionsFor("restaurants")))
  addPhoto(
    @Param("id") restaurantId: string,
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploads.addGalleryPhoto(restaurantId, user as any, file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
  @Delete("restaurants/:id/photos/:photoId")
  deletePhoto(
    @Param("id") restaurantId: string,
    @Param("photoId") photoId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.uploads.deleteGalleryPhoto(restaurantId, photoId, user as any);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
  @Patch("restaurants/:id/photos/:photoId/primary")
  setPrimary(
    @Param("id") restaurantId: string,
    @Param("photoId") photoId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.uploads.setPrimaryGalleryPhoto(restaurantId, photoId, user as any);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
  @Post("dishes/:id/photo")
  @UseInterceptors(FileInterceptor("file", multerOptionsFor("dishes")))
  setDishPhoto(
    @Param("id") dishId: string,
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploads.setDishPhoto(dishId, user as any, file);
  }

  // Any authenticated role — always the caller's own account (no id param).
  @UseGuards(JwtAuthGuard)
  @Post("users/me/avatar")
  @UseInterceptors(FileInterceptor("file", multerOptionsFor("avatars")))
  setAvatar(@CurrentUser() user: AuthUser, @UploadedFile() file: Express.Multer.File) {
    return this.uploads.setUserAvatar(user as any, file);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("users/me/avatar")
  removeAvatar(@CurrentUser() user: AuthUser) {
    return this.uploads.removeUserAvatar(user as any);
  }
}
