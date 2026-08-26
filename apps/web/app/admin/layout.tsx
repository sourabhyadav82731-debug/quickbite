"use client";

import { ReactNode } from "react";
import { PortalChrome } from "@/components/portal-chrome";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/live-map", label: "Live Map" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/restaurants", label: "Restaurants" },
  { href: "/admin/delivery", label: "Fleet" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/operations", label: "Operations" },
  { href: "/admin/finance", label: "Finance" },
  { href: "/admin/risk", label: "Risk" },
  { href: "/admin/audit", label: "Audit Log" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <PortalChrome portal="admin" title="👑 QuickBite Admin" navLinks={NAV}>
      {children}
    </PortalChrome>
  );
}
