"use client";

import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";

export default function CartPage() {
  const router = useRouter();
  const { items, restaurantName, updateQuantity, total, clear } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="glass-card p-10 text-center opacity-60">
        Your cart is empty. Go add something delicious.
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold">{restaurantName}</h1>
      <div className="glass-card divide-y" style={{ borderColor: "var(--portal-border)" }}>
        {items.map((item) => (
          <div
            key={`${item.dishId}-${item.addons.map((a) => a.addonId).join(",")}`}
            className="p-4 flex items-start justify-between gap-3"
          >
            <div className="flex-1">
              <div className="font-medium text-sm">{item.name}</div>
              {item.addons.length > 0 && (
                <div className="text-xs opacity-60">
                  {item.addons.map((a) => a.name).join(", ")}
                </div>
              )}
              {item.specialInstructions && (
                <div className="text-xs opacity-50 italic">"{item.specialInstructions}"</div>
              )}
              <div className="text-sm font-semibold mt-1">
                ₹{(item.unitPrice + item.addons.reduce((s, a) => s + a.price, 0)) * item.quantity}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.dishId, item.addons, -1)}
                className="w-7 h-7 rounded-full glass-card flex items-center justify-center"
              >
                −
              </button>
              <span className="w-4 text-center text-sm">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.dishId, item.addons, 1)}
                className="w-7 h-7 rounded-full glass-card flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm">
        <button onClick={clear} className="opacity-60 underline">
          Clear cart
        </button>
        <span className="font-bold">Item total: ₹{total()}</span>
      </div>

      <button
        onClick={() => router.push("/customer/checkout")}
        className="portal-btn-primary w-full py-3 text-sm"
      >
        Proceed to Checkout
      </button>
    </div>
  );
}
