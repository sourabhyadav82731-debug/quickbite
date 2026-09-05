import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity("restaurant_holidays")
export class RestaurantHolidayEntity extends BaseEntity {
  @Index()
  @Column()
  restaurantId: string;

  // "YYYY-MM-DD" — compared as a plain string against the server's current
  // date, same precision a restaurant owner picks in a date input.
  @Column()
  date: string;

  @Column()
  label: string;
}
