import { z } from "zod";
import {
  AddressLabel,
  DietaryTag,
  PaymentMethod,
  UserRole,
  VehicleType,
  DeliveryStage,
  RestaurantAvailabilityStatus,
  StaffRole,
} from "@quickbite/types";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type LoginInput = z.infer<typeof loginSchema>;

// Public self-registration must never be able to mint an ADMIN account — admins
// are provisioned out-of-band (currently: seed data only). Restaurant owner and
// delivery partner remain self-assignable here since the existing architecture
// gates their real capabilities behind separate approval (restaurant status
// starts PENDING_APPROVAL; admin approves) rather than at the account-role level.
export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  role: z
    .enum([UserRole.CUSTOMER, UserRole.RESTAURANT_OWNER, UserRole.DELIVERY_PARTNER])
    .default(UserRole.CUSTOMER),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const addressSchema = z.object({
  label: z.nativeEnum(AddressLabel),
  line1: z.string().min(3),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().min(4),
  lat: z.number(),
  lng: z.number(),
  isDefault: z.boolean().optional(),
});
export type AddressInput = z.infer<typeof addressSchema>;

const cartAddonSelectionSchema = z.object({
  addonId: z.string(),
  name: z.string(),
  price: z.number().nonnegative(),
});

const cartItemSchema = z.object({
  dishId: z.string(),
  name: z.string(),
  unitPrice: z.number().nonnegative(),
  quantity: z.number().int().positive(),
  addons: z.array(cartAddonSelectionSchema).default([]),
  specialInstructions: z.string().optional(),
});

export const checkoutSchema = z.object({
  restaurantId: z.string(),
  addressId: z.string(),
  items: z.array(cartItemSchema).min(1),
  couponCode: z.string().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  tipAmount: z.number().nonnegative().default(0),
  specialInstructions: z.string().optional(),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const menuCategorySchema = z.object({
  name: z.string().min(2),
  sortOrder: z.number().int().nonnegative().default(0),
});
export type MenuCategoryInput = z.infer<typeof menuCategorySchema>;

export const menuCategoryUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});
export type MenuCategoryUpdateInput = z.infer<typeof menuCategoryUpdateSchema>;

// Owner-editable fields only — commissionRate/status/rating/ratingCount/
// ownerId are deliberately absent (admin/system-controlled) so a restaurant
// owner can never grant themselves a lower commission or self-approve their
// own PENDING_APPROVAL status through this endpoint.
export const restaurantUpdateSchema = z
  .object({
    name: z.string().min(2),
    description: z.string(),
    cuisines: z.array(z.string()),
    coverImageUrl: z.string().nullable(),
    fssaiLicense: z.string(),
    avgPrepTimeMinutes: z.number().int().positive(),
    costForTwo: z.number().nonnegative(),
    deliveryRadiusKm: z.number().positive(),
    lat: z.number(),
    lng: z.number(),
    isAcceptingOrders: z.boolean(),
    availabilityStatus: z.nativeEnum(RestaurantAvailabilityStatus),
    pauseReason: z.string().nullable(),
    hours: z
      .array(
        z.object({
          dayOfWeek: z.number().int().min(0).max(6),
          open: z.string(),
          close: z.string(),
          closed: z.boolean(),
        }),
      )
      .length(7)
      .nullable(),
  })
  .partial();
export type RestaurantUpdateInput = z.infer<typeof restaurantUpdateSchema>;

export const restaurantAvailabilitySchema = z.object({
  availabilityStatus: z.nativeEnum(RestaurantAvailabilityStatus),
  pauseReason: z.string().optional(),
});
export type RestaurantAvailabilityInput = z.infer<typeof restaurantAvailabilitySchema>;

export const restaurantHolidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  label: z.string().min(1),
});
export type RestaurantHolidayInput = z.infer<typeof restaurantHolidaySchema>;

export const staffCreateSchema = z.object({
  restaurantId: z.string(),
  name: z.string().min(1),
  email: z.string().email().optional(),
  role: z.nativeEnum(StaffRole),
});
export type StaffCreateInput = z.infer<typeof staffCreateSchema>;

export const staffUpdateSchema = z
  .object({
    role: z.nativeEnum(StaffRole),
    isActive: z.boolean(),
  })
  .partial();
export type StaffUpdateInput = z.infer<typeof staffUpdateSchema>;

export const dishSchema = z.object({
  categoryId: z.string(),
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().positive(),
  discountPrice: z.number().positive().optional(),
  // Admin-only in practice — MenuService rejects this field from non-admin callers.
  customerPrice: z.number().positive().optional(),
  imageUrl: z.string().optional(),
  dietaryTags: z.array(z.nativeEnum(DietaryTag)).default([]),
  calories: z.number().int().nonnegative().optional(),
  isInStock: z.boolean().default(true),
});
export type DishInput = z.infer<typeof dishSchema>;

export const addonGroupSchema = z.object({
  dishId: z.string(),
  name: z.string().min(2),
  isRequired: z.boolean().default(false),
  minSelect: z.number().int().nonnegative().default(0),
  maxSelect: z.number().int().positive().default(1),
  addons: z
    .array(z.object({ name: z.string().min(1), price: z.number().nonnegative() }))
    .default([]),
});
export type AddonGroupInput = z.infer<typeof addonGroupSchema>;

export const couponSchema = z.object({
  code: z.string().min(3).toUpperCase(),
  restaurantId: z.string().optional(),
  type: z.enum(["PERCENTAGE", "FLAT", "FREE_DELIVERY"]),
  value: z.number().nonnegative(),
  minOrderValue: z.number().nonnegative().default(0),
  maxDiscount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string(),
  isActive: z.boolean().default(true),
});
export type CouponInput = z.infer<typeof couponSchema>;

export const couponUpdateSchema = z
  .object({
    value: z.number().nonnegative(),
    minOrderValue: z.number().nonnegative(),
    maxDiscount: z.number().positive().nullable(),
    usageLimit: z.number().int().positive().nullable(),
    perUserLimit: z.number().int().positive().nullable(),
    startsAt: z.string().nullable(),
    expiresAt: z.string(),
    isActive: z.boolean(),
  })
  .partial();
export type CouponUpdateInput = z.infer<typeof couponUpdateSchema>;

export const reviewSchema = z.object({
  orderId: z.string(),
  restaurantId: z.string().optional(),
  driverId: z.string().optional(),
  foodRating: z.number().min(1).max(5),
  packagingRating: z.number().min(1).max(5).optional(),
  deliveryRating: z.number().min(1).max(5).optional(),
  comment: z.string().optional(),
});
export type ReviewInput = z.infer<typeof reviewSchema>;

export const driverProfileSchema = z.object({
  vehicleType: z.nativeEnum(VehicleType),
  vehicleNumber: z.string().min(4),
});
export type DriverProfileInput = z.infer<typeof driverProfileSchema>;

export const orderStatusUpdateSchema = z.object({
  status: z.enum([
    "ACCEPTED",
    "PREPARING",
    "READY_FOR_PICKUP",
    "CANCELLED",
  ]),
  reason: z.string().optional(),
});
export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>;

export const deliveryStageAdvanceSchema = z.object({
  stage: z.nativeEnum(DeliveryStage),
  otp: z.string().length(4).optional(),
});
export type DeliveryStageAdvanceInput = z.infer<typeof deliveryStageAdvanceSchema>;

export const deliveryLocationUpdateSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});
export type DeliveryLocationUpdateInput = z.infer<typeof deliveryLocationUpdateSchema>;

// role is accepted for wire-contract compliance only — SupportController never
// reads it; the actual role always comes from the authenticated JWT.
export const assistantRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  language: z.string().min(2).max(15),
  role: z.string().optional(),
  context: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});
export type AssistantRequestInput = z.infer<typeof assistantRequestSchema>;

export const reverseGeocodeSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type ReverseGeocodeInput = z.infer<typeof reverseGeocodeSchema>;

export const verifyPaymentSchema = z.object({
  orderId: z.string(),
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
