import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "./base.entity";

/** Gallery photos for a restaurant. `restaurant.coverImageUrl` (pre-existing
 *  column) always mirrors whichever row here has `isCover: true`, so every
 *  existing read path that already renders `coverImageUrl` keeps working
 *  unchanged — this table only adds the "more than one photo" capability. */
@Entity("restaurant_photos")
export class RestaurantPhotoEntity extends BaseEntity {
  @Index()
  @Column()
  restaurantId: string;

  @Column()
  url: string;

  @Column({ default: false })
  isCover: boolean;

  @Column({ type: "int", default: 0 })
  sortOrder: number;
}
