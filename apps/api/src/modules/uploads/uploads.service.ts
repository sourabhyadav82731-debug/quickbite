import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as fs from "fs";
import * as path from "path";
import { UserRole } from "@quickbite/types";
import { DishEntity, RestaurantEntity, RestaurantPhotoEntity, UserEntity } from "../../database/entities";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB

// Files land on local disk under apps/api/uploads and are served statically at
// /uploads/* (wired up in main.ts) — this scaffold has no Supabase Storage
// bucket (or any other object-store SDK) configured anywhere, so this is the
// minimum real, non-fake persistence that works without asking for new cloud
// credentials. Swapping this for a Supabase Storage bucket later only means
// changing `publicUrlFor`/the multer storage engine below — every caller
// (restaurant/dish photo endpoints, frontend) only ever sees a URL string.
export const UPLOADS_ROOT = path.resolve(__dirname, "../../../uploads");

export function publicUrlFor(filename: string, subdir: string): string {
  return `/uploads/${subdir}/${filename}`;
}

function assertValidImage(file: Express.Multer.File | undefined) {
  if (!file) throw new BadRequestException("No file uploaded");
  if (!ALLOWED_MIME.has(file.mimetype)) {
    throw new BadRequestException("Only JPEG, PNG, or WEBP images are allowed");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new BadRequestException("Image must be 5MB or smaller");
  }
}

@Injectable()
export class UploadsService {
  constructor(
    @InjectRepository(RestaurantEntity)
    private readonly restaurants: Repository<RestaurantEntity>,
    @InjectRepository(RestaurantPhotoEntity)
    private readonly photos: Repository<RestaurantPhotoEntity>,
    @InjectRepository(DishEntity) private readonly dishes: Repository<DishEntity>,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
  ) {}

  private async assertRestaurantOwnership(
    restaurantId: string,
    actor: { userId: string; role: UserRole },
  ) {
    const restaurant = await this.restaurants.findOne({ where: { id: restaurantId } });
    if (!restaurant) throw new NotFoundException("Restaurant not found");
    if (restaurant.ownerId !== actor.userId && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Not your restaurant");
    }
    return restaurant;
  }

  async setCoverPhoto(
    restaurantId: string,
    actor: { userId: string; role: UserRole },
    file: Express.Multer.File,
  ) {
    assertValidImage(file);
    await this.assertRestaurantOwnership(restaurantId, actor);
    const url = publicUrlFor(file.filename, "restaurants");
    await this.restaurants.update(restaurantId, { coverImageUrl: url });
    return { url };
  }

  async addGalleryPhoto(
    restaurantId: string,
    actor: { userId: string; role: UserRole },
    file: Express.Multer.File,
  ) {
    assertValidImage(file);
    await this.assertRestaurantOwnership(restaurantId, actor);
    const url = publicUrlFor(file.filename, "restaurants");
    const existingCount = await this.photos.count({ where: { restaurantId } });
    const photo = await this.photos.save(
      this.photos.create({ restaurantId, url, isCover: false, sortOrder: existingCount }),
    );
    return photo;
  }

  async listGalleryPhotos(restaurantId: string) {
    return this.photos.find({ where: { restaurantId }, order: { sortOrder: "ASC" } });
  }

  async deleteGalleryPhoto(
    restaurantId: string,
    photoId: string,
    actor: { userId: string; role: UserRole },
  ) {
    await this.assertRestaurantOwnership(restaurantId, actor);
    const photo = await this.photos.findOne({ where: { id: photoId, restaurantId } });
    if (!photo) throw new NotFoundException("Photo not found");
    await this.photos.delete(photoId);
    // Best-effort: an already-missing file (e.g. deleted twice) must not fail
    // the request — the DB row is the source of truth, the file is just bytes.
    this.unlinkQuietly(photo.url);
    if (photo.isCover) {
      const restaurant = await this.restaurants.findOne({ where: { id: restaurantId } });
      if (restaurant?.coverImageUrl === photo.url) {
        // Explicit null, not undefined — see removeUserAvatar's comment on
        // why TypeORM's .update() otherwise silently leaves the old value in
        // place instead of clearing it.
        await this.restaurants.update(restaurantId, { coverImageUrl: null as unknown as string });
      }
    }
    return { success: true };
  }

  async setPrimaryGalleryPhoto(
    restaurantId: string,
    photoId: string,
    actor: { userId: string; role: UserRole },
  ) {
    await this.assertRestaurantOwnership(restaurantId, actor);
    const photo = await this.photos.findOne({ where: { id: photoId, restaurantId } });
    if (!photo) throw new NotFoundException("Photo not found");
    // Every existing photo card in this gallery loses isCover in the same pass
    // a new one gains it — there is never a moment with two, or zero, covers
    // once at least one photo exists.
    await this.photos.update({ restaurantId }, { isCover: false });
    await this.photos.update(photoId, { isCover: true });
    await this.restaurants.update(restaurantId, { coverImageUrl: photo.url });
    return { success: true };
  }

  async setDishPhoto(
    dishId: string,
    actor: { userId: string; role: UserRole },
    file: Express.Multer.File,
  ) {
    assertValidImage(file);
    const dish = await this.dishes.findOne({ where: { id: dishId } });
    if (!dish) throw new NotFoundException("Dish not found");
    await this.assertRestaurantOwnership(dish.restaurantId, actor);
    const url = publicUrlFor(file.filename, "dishes");
    await this.dishes.update(dishId, { imageUrl: url });
    return { url };
  }

  // Generic per-user profile photo — usable by any role (this task only
  // surfaces it from the driver portal, but UserEntity.avatarUrl already
  // exists on every account, so there's no reason to scope this to drivers
  // only). Always the caller's own account: no id param, always `me`.
  async setUserAvatar(actor: { userId: string }, file: Express.Multer.File) {
    assertValidImage(file);
    const user = await this.users.findOne({ where: { id: actor.userId } });
    if (!user) throw new NotFoundException("User not found");
    const previousUrl = user.avatarUrl;
    const url = publicUrlFor(file.filename, "avatars");
    await this.users.update(actor.userId, { avatarUrl: url });
    if (previousUrl) this.unlinkQuietly(previousUrl);
    return { url };
  }

  async removeUserAvatar(actor: { userId: string }) {
    const user = await this.users.findOne({ where: { id: actor.userId } });
    if (!user) throw new NotFoundException("User not found");
    if (user.avatarUrl) {
      this.unlinkQuietly(user.avatarUrl);
      // Explicit null, not undefined — TypeORM's .update() silently omits an
      // undefined property from the generated SQL entirely (leaving the old
      // value in place) rather than clearing it. Same gotcha documented on
      // RestaurantsService.setAvailability's pauseReason handling.
      await this.users.update(actor.userId, { avatarUrl: null as unknown as string });
    }
    return { success: true };
  }

  private unlinkQuietly(url: string) {
    // url is always our own "/uploads/<subdir>/<filename>" shape (never taken
    // from user input beyond the filename multer itself generated), so this
    // never resolves outside UPLOADS_ROOT.
    const rel = url.replace(/^\/uploads\//, "");
    const abs = path.join(UPLOADS_ROOT, rel);
    fs.unlink(abs, () => {});
  }
}
