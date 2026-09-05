"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";

/** Persistent bottom bar showing cart state — appears app-wide across the
 *  customer portal whenever the cart has items, except on the cart/checkout
 *  pages themselves where it would be redundant. */
export function CartBar() {
  const router = useRouter();
  const pathname = usePathname();
  const items = useCartStore((s) => s.items);

  const itemCount = items.reduce((n, i) => n + i.quantity, 0);
  const total = items.reduce(
    (sum, i) => sum + (i.unitPrice + i.addons.reduce((a, x) => a + x.price, 0)) * i.quantity,
    0,
  );

  const hideOnPaths = ["/customer/cart", "/customer/checkout"];
  if (itemCount === 0 || hideOnPaths.includes(pathname)) return null;

  return (
    <button
      onClick={() => router.push("/customer/cart")}
      className="fixed bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-full sm:max-w-md z-30 rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-lg text-white font-medium"
      style={{ background: "var(--portal-primary)" }}
    >
      <span className="text-sm">
        {itemCount} {itemCount === 1 ? "Item" : "Items"} | ₹{total.toFixed(0)}
      </span>
      <span className="text-sm font-bold">GO TO CART →</span>
    </button>
  );
}
