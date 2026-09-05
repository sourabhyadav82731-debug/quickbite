export * from "./user.entity";
export * from "./address.entity";
export * from "./restaurant.entity";
export * from "./menu-category.entity";
export * from "./dish.entity";
export * from "./addon-group.entity";
export * from "./addon.entity";
export * from "./order.entity";
export * from "./order-item.entity";
export * from "./payment.entity";
export * from "./coupon.entity";
export * from "./driver-profile.entity";
export * from "./delivery.entity";
export * from "./review.entity";
export * from "./notification.entity";
export * from "./audit-log.entity";
export * from "./restaurant-photo.entity";
export * from "./withdrawal-request.entity";
export * from "./restaurant-holiday.entity";
export * from "./staff.entity";
export * from "./order-status-history.entity";
export * from "./refund.entity";

import { UserEntity } from "./user.entity";
import { AddressEntity } from "./address.entity";
import { RestaurantEntity } from "./restaurant.entity";
import { MenuCategoryEntity } from "./menu-category.entity";
import { DishEntity } from "./dish.entity";
import { AddonGroupEntity } from "./addon-group.entity";
import { AddonEntity } from "./addon.entity";
import { OrderEntity } from "./order.entity";
import { OrderItemEntity } from "./order-item.entity";
import { PaymentEntity } from "./payment.entity";
import { CouponEntity } from "./coupon.entity";
import { DriverProfileEntity } from "./driver-profile.entity";
import { DeliveryEntity } from "./delivery.entity";
import { ReviewEntity } from "./review.entity";
import { NotificationEntity } from "./notification.entity";
import { AuditLogEntity } from "./audit-log.entity";
import { RestaurantPhotoEntity } from "./restaurant-photo.entity";
import { WithdrawalRequestEntity } from "./withdrawal-request.entity";
import { RestaurantHolidayEntity } from "./restaurant-holiday.entity";
import { StaffEntity } from "./staff.entity";
import { OrderStatusHistoryEntity } from "./order-status-history.entity";
import { RefundEntity } from "./refund.entity";

export const ALL_ENTITIES = [
  UserEntity,
  AddressEntity,
  RestaurantEntity,
  MenuCategoryEntity,
  DishEntity,
  AddonGroupEntity,
  AddonEntity,
  OrderEntity,
  OrderItemEntity,
  PaymentEntity,
  CouponEntity,
  DriverProfileEntity,
  DeliveryEntity,
  ReviewEntity,
  NotificationEntity,
  AuditLogEntity,
  RestaurantPhotoEntity,
  WithdrawalRequestEntity,
  RestaurantHolidayEntity,
  StaffEntity,
  OrderStatusHistoryEntity,
  RefundEntity,
];
