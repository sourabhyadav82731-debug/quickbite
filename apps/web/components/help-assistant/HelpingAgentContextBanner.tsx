"use client";

import { useQuery } from "@tanstack/react-query";
import { OrderStatus, SupportedLanguage } from "@quickbite/types";
import { api, apiClient } from "@/lib/api";
import { useRestaurant } from "@/lib/restaurant-context";
import { Portal } from "./types";

// Small, safe-context-only pill under the header. Every field rendered here
// is explicitly picked (never spread) from data already fetched by existing
// endpoints — never an OTP, token, or payment field, because those fields
// are never read out of the response objects below in the first place.

const CUSTOMER_HIDDEN_STATUSES: string[] = [
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
  OrderStatus.PAYMENT_PENDING,
];

function CustomerBanner() {
  const { data } = useQuery({ queryKey: ["my-orders"], queryFn: () => api.orders.list() });
  const active = ((data as any[]) ?? []).find((o) => !CUSTOMER_HIDDEN_STATUSES.includes(o.status));
  if (!active) return null;
  return (
    <div className="qb-context-pill">
      📦 Order #{String(active.id).slice(0, 6).toUpperCase()} · {String(active.status).replace(/_/g, " ")}
    </div>
  );
}

// Only ever mounted for portal === "restaurant", so it's always inside the
// RestaurantProvider tree — useRestaurant() would throw otherwise.
function RestaurantBanner() {
  const { active } = useRestaurant();
  const { data } = useQuery({
    queryKey: ["kitchen-orders", active?.id],
    queryFn: () => api.orders.list(`?restaurantId=${active!.id}`),
    enabled: !!active,
  });
  const pending = ((data as any[]) ?? []).filter((o) => o.status === OrderStatus.PLACED).length;
  if (!pending) return null;
  return <div className="qb-context-pill">📦 {pending} Pending Orders</div>;
}

function DriverBanner() {
  const { data } = useQuery({
    queryKey: ["driver-active"],
    queryFn: () => apiClient.get<any[]>("/deliveries/active"),
    refetchInterval: 8000,
  });
  const delivery = ((data as any[]) ?? [])[0];
  if (!delivery) return null;
  return <div className="qb-context-pill">🚀 Active Delivery · {delivery.restaurantName ?? "Restaurant"}</div>;
}

export function HelpingAgentContextBanner({ portal }: { portal: Portal; language: SupportedLanguage }) {
  if (portal === "customer") return <CustomerBanner />;
  if (portal === "restaurant") return <RestaurantBanner />;
  if (portal === "delivery") return <DriverBanner />;
  return null; // admin: no single-line context banner in this build
}
