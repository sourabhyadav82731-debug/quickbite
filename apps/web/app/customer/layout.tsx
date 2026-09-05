"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { PortalChrome } from "@/components/portal-chrome";
import { CartBar } from "@/components/cart-bar";
import { useCartStore } from "@/lib/cart-store";

const NAV = [
  { href: "/customer", label: "Home", icon: "🏠" },
  { href: "/customer/orders", label: "Orders", icon: "📦" },
  { href: "/customer/offers", label: "Offers", icon: "🏷️" },
  { href: "/customer/addresses", label: "Addresses", icon: "📍" },
  { href: "/customer/profile", label: "Profile", icon: "👤" },
  { href: "/customer/help", label: "Help", icon: "❓" },
];

export default function CustomerLayout({ children }: { children: ReactNode }) {
  const itemCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));

  return (
    <PortalChrome
      portal="customer"
      title="🍔 Quickbits"
      navLinks={NAV}
      extraHeader={
        <Link
          href="/customer/cart"
          className="relative px-3 py-1.5 rounded-lg text-sm font-medium"
          style={{ background: "var(--qbnav-border)", color: "var(--qbnav-text)" }}
        >
          🛒 Cart
          {itemCount > 0 && (
            <span
              className="absolute -top-1.5 -right-1.5 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
              style={{ background: "var(--qb-glow)", color: "#171313" }}
            >
              {itemCount}
            </span>
          )}
        </Link>
      }
    >
      <div style={itemCount > 0 ? { paddingBottom: "5rem" } : undefined}>{children}</div>
      <CartBar />
    </PortalChrome>
  );
}
