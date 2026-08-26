"use client";

import { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PortalChrome } from "@/components/portal-chrome";
import { RestaurantProvider, useRestaurant } from "@/lib/restaurant-context";
import { apiClient } from "@/lib/api";

const NAV = [
  { href: "/restaurant", label: "Dashboard" },
  { href: "/restaurant/kitchen", label: "Kitchen" },
  { href: "/restaurant/orders", label: "Orders" },
  { href: "/restaurant/menu", label: "Menu" },
  { href: "/restaurant/hours", label: "Hours" },
  { href: "/restaurant/reviews", label: "Reviews" },
  { href: "/restaurant/offers", label: "Offers" },
  { href: "/restaurant/finance", label: "Finance" },
  { href: "/restaurant/staff", label: "Staff" },
  { href: "/restaurant/assistant", label: "AI Copilot" },
  { href: "/restaurant/support", label: "Support" },
];

function OutletSwitcher() {
  const { restaurants, active, activeId, setActiveId } = useRestaurant();
  const qc = useQueryClient();

  async function toggleAccepting() {
    if (!active) return;
    await apiClient.patch(`/restaurants/${active.id}`, {
      isAcceptingOrders: !active.isAcceptingOrders,
    });
    qc.invalidateQueries({ queryKey: ["my-restaurants"] });
  }

  if (!active) return null;

  return (
    <div className="flex items-center gap-2">
      {restaurants.length > 1 && (
        <select
          value={activeId ?? ""}
          onChange={(e) => setActiveId(e.target.value)}
          className="text-xs px-2 py-1.5 rounded-lg glass-card"
        >
          {restaurants.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      )}
      <button
        onClick={toggleAccepting}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
        style={{ background: active.isAcceptingOrders ? "#00B894" : "#95a5a6" }}
      >
        {active.isAcceptingOrders ? "Accepting Orders" : "Store Closed"}
      </button>
    </div>
  );
}

function LayoutInner({ children }: { children: ReactNode }) {
  return (
    <PortalChrome
      portal="restaurant"
      title="🍽️ QuickBite Partner"
      navLinks={NAV}
      extraHeader={<OutletSwitcher />}
    >
      {children}
    </PortalChrome>
  );
}

export default function RestaurantLayout({ children }: { children: ReactNode }) {
  return (
    <RestaurantProvider>
      <LayoutInner>{children}</LayoutInner>
    </RestaurantProvider>
  );
}
