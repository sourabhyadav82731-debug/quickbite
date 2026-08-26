"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { PortalChrome } from "@/components/portal-chrome";
import { useCartStore } from "@/lib/cart-store";

const NAV = [
  { href: "/customer", label: "Discover" },
  { href: "/customer/orders", label: "Orders" },
  { href: "/customer/offers", label: "Offers" },
  { href: "/customer/addresses", label: "Addresses" },
  { href: "/customer/profile", label: "Profile" },
  { href: "/customer/help", label: "Help" },
];

export default function CustomerLayout({ children }: { children: ReactNode }) {
  const itemCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));

  return (
    <PortalChrome
      portal="customer"
      title="🍔 QuickBite"
      navLinks={NAV}
      extraHeader={
        <Link
          href="/customer/cart"
          className="relative px-3 py-1.5 rounded-lg text-sm font-medium"
          style={{ background: "var(--portal-border)" }}
        >
          🛒 Cart
          {itemCount > 0 && (
            <span
              className="absolute -top-1.5 -right-1.5 text-[10px] font-bold text-white rounded-full w-4 h-4 flex items-center justify-center"
              style={{ background: "var(--portal-primary)" }}
            >
              {itemCount}
            </span>
          )}
        </Link>
      }
    >
      {children}
    </PortalChrome>
  );
}
