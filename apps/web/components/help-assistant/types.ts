import { AssistantAction, UserRole } from "@quickbite/types";

export type Portal = "customer" | "restaurant" | "delivery" | "admin";

export const PORTAL_ROLE: Record<Portal, UserRole> = {
  customer: UserRole.CUSTOMER,
  restaurant: UserRole.RESTAURANT_OWNER,
  delivery: UserRole.DELIVERY_PARTNER,
  admin: UserRole.ADMIN,
};

export interface ChatMessage {
  id: string;
  from: "user" | "assistant";
  text: string;
  actions?: AssistantAction[];
}
