"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartAddonSelection, CartItem } from "@quickbite/types";

interface CartState {
  restaurantId: string | null;
  restaurantName: string | null;
  items: CartItem[];
  addItem: (
    restaurantId: string,
    restaurantName: string,
    item: Omit<CartItem, "quantity"> & { quantity?: number },
  ) => void;
  updateQuantity: (dishId: string, addons: CartAddonSelection[], delta: number) => void;
  clear: () => void;
  total: () => number;
}

function lineKey(dishId: string, addons: CartAddonSelection[]) {
  return `${dishId}::${addons.map((a) => a.addonId).sort().join(",")}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      restaurantId: null,
      restaurantName: null,
      items: [],
      addItem: (restaurantId, restaurantName, item) => {
        set((state) => {
          const isNewRestaurant = state.restaurantId && state.restaurantId !== restaurantId;
          const baseItems = isNewRestaurant ? [] : state.items;
          const key = lineKey(item.dishId, item.addons);
          const existingIdx = baseItems.findIndex(
            (i) => lineKey(i.dishId, i.addons) === key,
          );
          const items = [...baseItems];
          if (existingIdx >= 0) {
            items[existingIdx] = {
              ...items[existingIdx],
              quantity: items[existingIdx].quantity + (item.quantity ?? 1),
            };
          } else {
            items.push({ ...item, quantity: item.quantity ?? 1 });
          }
          return { restaurantId, restaurantName, items };
        });
      },
      updateQuantity: (dishId, addons, delta) => {
        set((state) => {
          const key = lineKey(dishId, addons);
          const items = state.items
            .map((i) =>
              lineKey(i.dishId, i.addons) === key
                ? { ...i, quantity: i.quantity + delta }
                : i,
            )
            .filter((i) => i.quantity > 0);
          return { items, restaurantId: items.length ? state.restaurantId : null };
        });
      },
      clear: () => set({ restaurantId: null, restaurantName: null, items: [] }),
      total: () =>
        get().items.reduce(
          (sum, i) =>
            sum + (i.unitPrice + i.addons.reduce((a, x) => a + x.price, 0)) * i.quantity,
          0,
        ),
    }),
    { name: "quickbite-customer-cart" },
  ),
);
