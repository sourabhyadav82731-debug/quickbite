"use client";

import { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PortalChrome } from "@/components/portal-chrome";
import { RestaurantProvider, useRestaurant } from "@/lib/restaurant-context";
import { apiClient } from "@/lib/api";

const NAV = [
  { href: "/restaurant", label: "Dashboard", icon: "🏠" },
  { href: "/restaurant/orders", label: "Orders", icon: "📋" },
  { href: "/restaurant/kitchen", label: "Kitchen", icon: "🍳" },
  { href: "/restaurant/menu", label: "Menu", icon: "📖" },
  { href: "/restaurant/menu/categories", label: "Categories", icon: "📂" },
  { href: "/restaurant/offers", label: "Offers & Coupons", icon: "🏷️" },
  { href: "/restaurant/reviews", label: "Reviews", icon: "⭐" },
  { href: "/restaurant/staff", label: "Staff", icon: "👥" },
  { href: "/restaurant/hours", label: "Hours & Holidays", icon: "🕒" },
  { href: "/restaurant/finance", label: "Settlements", icon: "💰" },
  { href: "/restaurant/photos", label: "Restaurant Photos", icon: "📷" },
  { href: "/restaurant/profile", label: "Settings", icon: "⚙️" },
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
          className="text-xs px-2 py-1.5 rounded-lg d3-card"
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
        className="d3-btn px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5"
        style={{ background: active.isAcceptingOrders ? "linear-gradient(135deg,#00b894,#00d9a3)" : "#95a5a6" }}
      >
        <span className={`w-2 h-2 rounded-full bg-white ${active.isAcceptingOrders ? "d3-pulse" : ""}`} />
        {active.isAcceptingOrders ? "Accepting Orders" : "Store Closed"}
      </button>
    </div>
  );
}

function LayoutInner({ children }: { children: ReactNode }) {
  return (
    <PortalChrome
      portal="restaurant"
      title="🍽️ Quickbits Partner"
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
