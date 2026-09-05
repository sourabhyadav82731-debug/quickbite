import { UserRole } from "@quickbite/types";

export interface NavItemConfig {
  href: string;
  label: string;
  icon: string;
}

export type Portal = "customer" | "restaurant" | "delivery" | "admin";

export const PORTAL_ROLE_LABEL: Record<UserRole, string> = {
  [UserRole.CUSTOMER]: "Customer",
  [UserRole.RESTAURANT_OWNER]: "Restaurant Owner",
  [UserRole.DELIVERY_PARTNER]: "Driver",
  [UserRole.ADMIN]: "Administrator",
};

// Existing profile-page routes only — reused, never invented. Admin has no
// profile page in this build, so its card points at Settings instead.
export const PORTAL_PROFILE_ROUTE: Record<Portal, string> = {
  customer: "/customer/profile",
  restaurant: "/restaurant/profile",
  delivery: "/delivery/profile",
  admin: "/admin/settings",
};
