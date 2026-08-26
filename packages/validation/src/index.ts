import { z } from "zod";
import {
  AddressLabel,
  DietaryTag,
  PaymentMethod,
  UserRole,
  VehicleType,
  DeliveryStage,
} from "@quickbite/types";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole).default(UserRole.CUSTOMER),
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

export const dishSchema = z.object({
  categoryId: z.string(),
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().positive(),
  discountPrice: z.number().positive().optional(),
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
  expiresAt: z.string(),
  isActive: z.boolean().default(true),
});
export type CouponInput = z.infer<typeof couponSchema>;

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

export const verifyPaymentSchema = z.object({
  orderId: z.string(),
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
