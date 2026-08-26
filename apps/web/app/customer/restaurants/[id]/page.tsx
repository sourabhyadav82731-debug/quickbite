"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { useCartStore } from "@/lib/cart-store";

export default function RestaurantMenuPage() {
  const { id } = useParams<{ id: string }>();
  const { data: restaurant } = useQuery({
    queryKey: ["restaurant", id],
    queryFn: () => api.restaurants.get(id),
  });
  const { data: menu } = useQuery({
    queryKey: ["menu", id],
    queryFn: () => api.restaurants.menu(id),
  });
  const [activeDish, setActiveDish] = useState<any | null>(null);

  const r = restaurant as any;
  const categories = (menu as any[]) ?? [];

  return (
    <div className="space-y-6">
      {r && (
        <div className="glass-card p-5">
          <h1 className="text-2xl font-bold">{r.name}</h1>
          <p className="opacity-70 text-sm mb-2">{r.description}</p>
          <div className="flex flex-wrap gap-3 text-xs opacity-70">
            <span>★ {r.rating.toFixed(1)} ({r.ratingCount})</span>
            <span>{r.avgPrepTimeMinutes} mins prep</span>
            <span>₹{r.costForTwo} for two</span>
            <span>{r.deliveryRadiusKm}km radius</span>
            {r.fssaiLicense && <span>FSSAI {r.fssaiLicense}</span>}
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto sticky top-16 z-10 py-2" style={{ background: "var(--portal-bg)" }}>
        {categories.map((c) => (
          <a
            key={c.id}
            href={`#cat-${c.id}`}
            className="shrink-0 px-3 py-1.5 rounded-full text-sm glass-card"
          >
            {c.name}
          </a>
        ))}
      </div>

      {categories.map((category) => (
        <section key={category.id} id={`cat-${category.id}`}>
          <h2 className="text-lg font-bold mb-3">{category.name}</h2>
          <div className="space-y-3">
            {category.dishes.map((dish: any) => (
              <div key={dish.id} className="glass-card p-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-3 h-3 border-2 flex items-center justify-center"
                      style={{
                        borderColor: dish.dietaryTags?.includes("VEG") ? "#00B894" : "#E74C3C",
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background: dish.dietaryTags?.includes("VEG") ? "#00B894" : "#E74C3C",
                        }}
                      />
                    </span>
                    <span className="font-semibold">{dish.name}</span>
                    {!dish.isInStock && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-500">
                        Out of stock
                      </span>
                    )}
                  </div>
                  <p className="text-sm opacity-70 mb-1">{dish.description}</p>
                  <div className="text-sm">
                    {dish.discountPrice ? (
                      <>
                        <span className="font-bold">₹{dish.discountPrice}</span>{" "}
                        <span className="line-through opacity-50 text-xs">₹{dish.price}</span>
                      </>
                    ) : (
                      <span className="font-bold">₹{dish.price}</span>
                    )}
                    {dish.calories && <span className="opacity-50 text-xs"> · {dish.calories} cal</span>}
                    {dish.addonGroups?.length > 0 && (
                      <span className="opacity-50 text-xs"> · customizable</span>
                    )}
                  </div>
                </div>
                <button
                  disabled={!dish.isInStock}
                  onClick={() =>
                    dish.addonGroups?.length
                      ? setActiveDish(dish)
                      : useCartStore.getState().addItem(id, r?.name ?? "", {
                          dishId: dish.id,
                          name: dish.name,
                          unitPrice: dish.discountPrice ?? dish.price,
                          addons: [],
                        })
                  }
                  className="portal-btn-primary px-4 py-2 text-sm disabled:opacity-30"
                >
                  + ADD
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}

      {activeDish && (
        <AddonModal
          dish={activeDish}
          restaurantId={id}
          restaurantName={r?.name ?? ""}
          onClose={() => setActiveDish(null)}
        />
      )}
    </div>
  );
}

function AddonModal({
  dish,
  restaurantId,
  restaurantName,
  onClose,
}: {
  dish: any;
  restaurantId: string;
  restaurantName: string;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [instructions, setInstructions] = useState("");

  function toggle(groupId: string, addonId: string, maxSelect: number) {
    setSelected((prev) => {
      const current = prev[groupId] ?? [];
      if (current.includes(addonId)) {
        return { ...prev, [groupId]: current.filter((a) => a !== addonId) };
      }
      const next = maxSelect === 1 ? [addonId] : [...current, addonId].slice(-maxSelect);
      return { ...prev, [groupId]: next };
    });
  }

  const chosenAddons = dish.addonGroups.flatMap((g: any) =>
    (selected[g.id] ?? []).map((addonId) => g.addons.find((a: any) => a.id === addonId)),
  );
  const total = (dish.discountPrice ?? dish.price) + chosenAddons.reduce((s: number, a: any) => s + a.price, 0);

  function addToCart() {
    useCartStore.getState().addItem(restaurantId, restaurantName, {
      dishId: dish.id,
      name: dish.name,
      unitPrice: dish.discountPrice ?? dish.price,
      addons: chosenAddons.map((a: any) => ({ addonId: a.id, name: a.name, price: a.price })),
      specialInstructions: instructions || undefined,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="glass-card w-full max-w-md p-5 max-h-[80vh] overflow-y-auto"
        style={{ background: "var(--portal-bg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-1">{dish.name}</h3>
        <p className="text-sm opacity-70 mb-4">Customize your order</p>

        {dish.addonGroups.map((group: any) => (
          <div key={group.id} className="mb-4">
            <div className="font-semibold text-sm mb-2">
              {group.name} {group.isRequired && <span className="text-red-500">*</span>}
              <span className="opacity-50 font-normal"> (choose up to {group.maxSelect})</span>
            </div>
            <div className="space-y-1">
              {group.addons.map((addon: any) => (
                <label key={addon.id} className="flex items-center justify-between text-sm py-1">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(selected[group.id] ?? []).includes(addon.id)}
                      onChange={() => toggle(group.id, addon.id, group.maxSelect)}
                    />
                    {addon.name}
                  </span>
                  <span className="opacity-70">{addon.price > 0 ? `+₹${addon.price}` : "Free"}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        <textarea
          placeholder="Cooking instructions (optional)"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className="w-full glass-card p-2 text-sm mb-4"
          rows={2}
        />

        <div className="flex items-center justify-between">
          <button onClick={onClose} className="text-sm opacity-70">
            Cancel
          </button>
          <button onClick={addToCart} className="portal-btn-primary px-5 py-2 text-sm">
            Add · ₹{total}
          </button>
        </div>
      </div>
    </div>
  );
}
