"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api, API_URL } from "@/lib/api";
import { useCartStore } from "@/lib/cart-store";

const DESSERT_PATTERN = /dessert|sweet|ice\s*cream|cake|pastry|mithai/i;

function resolveUrl(url?: string | null) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_URL}${url}`;
}

/** Same-restaurant dessert/sweets upsell shown between the order items and
 *  the bill breakdown on checkout. Categories are free-text/restaurant-
 *  defined (no fixed enum in this schema) so "is this a dessert category" is
 *  a name match against dessert/sweet — restaurants that name their category
 *  exactly that (as the existing seed/demo data already does, e.g.
 *  "Desserts") show up automatically, no extra setup. Adding one of these
 *  goes through the exact same cart store as every other dish — cart-store's
 *  addItem already refuses to mix restaurants (clears the cart instead), so
 *  there's no separate mechanism needed to guarantee "same restaurant only". */
export function DessertUpsell({
  restaurantId,
  cartDishIds,
}: {
  restaurantId: string;
  cartDishIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const { data: menu } = useQuery({
    queryKey: ["menu", restaurantId],
    queryFn: () => api.restaurants.menu(restaurantId),
    enabled: open,
  });

  const desserts = ((menu as any[]) ?? [])
    .filter((c) => DESSERT_PATTERN.test(c.name))
    .flatMap((c) => c.dishes ?? [])
    .filter((d: any) => d.isInStock);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full glass-card p-4 text-left text-sm font-semibold flex items-center justify-between"
        style={{ minHeight: 44 }}
      >
        <span>Add Sweets &amp; Desserts 🍰</span>
        <span className="opacity-60 text-xs font-normal">Tap to browse</span>
      </button>
    );
  }

  return (
    <section className="glass-card p-4">
      <h2 className="font-semibold mb-3 text-sm">Suggested Desserts 🍰</h2>
      {desserts.length === 0 ? (
        <p className="text-xs opacity-60">No desserts available from this restaurant right now.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {desserts.map((dish: any) => (
            <DessertCard key={dish.id} dish={dish} restaurantId={restaurantId} inCart={cartDishIds.includes(dish.id)} />
          ))}
        </div>
      )}
    </section>
  );
}

function DessertCard({
  dish,
  restaurantId,
  inCart,
}: {
  dish: any;
  restaurantId: string;
  inCart: boolean;
}) {
  function add() {
    // Same addItem the main menu page uses — this becomes a real cart line,
    // flows through the exact same subtotal/fee/tax math on this page, and
    // never touches dish.price (the restaurant's own base price).
    useCartStore.getState().addItem(restaurantId, useCartStore.getState().restaurantName ?? "", {
      dishId: dish.id,
      name: dish.name,
      unitPrice: dish.sellingPrice,
      addons: [],
    });
  }

  return (
    <div className="rounded-xl p-2.5 space-y-1.5" style={{ background: "var(--portal-card)", border: "1px solid var(--portal-border)" }}>
      <div className="w-full h-16 rounded-lg overflow-hidden" style={{ background: "var(--portal-border)" }}>
        {dish.imageUrl ? (
          <img src={resolveUrl(dish.imageUrl) ?? ""} alt={dish.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl opacity-40">🍰</div>
        )}
      </div>
      <div className="text-xs font-semibold truncate">{dish.name}</div>
      {dish.description && <div className="text-[10px] opacity-60 truncate">{dish.description}</div>}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold" style={{ color: "var(--qb-primary)" }}>
          ₹{dish.sellingPrice}
        </span>
        <button
          onClick={add}
          className="qb-btn-cta text-[10px] px-2 py-1 rounded-lg"
          style={
            inCart
              ? { minHeight: 28, background: "var(--qb-primary)", color: "var(--qb-glow)" }
              : { minHeight: 28 }
          }
        >
          {inCart ? "✓ Added" : "+ Add"}
        </button>
      </div>
    </div>
  );
}
