// Platform-wide business constants shared by apps/api and apps/web.

export const RESTAURANT_COMMISSION_RATE = 0.18; // 18% default, admin can override 15-25% per restaurant
export const COMMISSION_RATE_MIN = 0.15;
export const COMMISSION_RATE_MAX = 0.25;

export const DELIVERY_FEE_BASE = 25; // INR
export const DELIVERY_FEE_PER_KM = 8; // INR
export const FREE_DELIVERY_THRESHOLD = 500; // INR order value above which delivery is free
export const PACKAGING_FEE = 15; // INR
export const PLATFORM_FEE = 5; // INR, flat per order

export const GST_RATE = 0.05; // 5% on food items
export const RESTAURANT_TAX_RATE = 0.025; // additional restaurant-level tax component

export const SURGE_MULTIPLIERS = {
  NONE: 1,
  LOW: 1.2,
  MEDIUM: 1.5,
  HIGH: 1.8,
} as const;

export const TIP_PRESETS = [20, 30, 50] as const;

export const OTP_LENGTH = 4;
export const DELIVERY_OFFER_ACCEPT_TIMEOUT_SECONDS = 45;

export const JWT_ACCESS_TTL = "15m";
export const JWT_REFRESH_TTL = "7d";

export const PAGINATION_DEFAULT_LIMIT = 20;

export const DAILY_INCENTIVE_TIERS = [
  { orders: 12, bonus: 250 },
  { orders: 20, bonus: 600 },
] as const;

export const PORTAL_ROUTES = {
  HUB: "/",
  CUSTOMER: "/customer",
  RESTAURANT: "/restaurant",
  DELIVERY: "/delivery",
  ADMIN: "/admin",
} as const;

export const PORTAL_THEME_COLORS = {
  customer: { primary: "#FF6B35", secondary: "#FFB534" },
  restaurant: { primary: "#00B894", secondary: "#55EFC4" },
  delivery: { primary: "#0984E3", secondary: "#2E86FF" },
  admin: { primary: "#6C5CE7", secondary: "#4834D4" },
} as const;
