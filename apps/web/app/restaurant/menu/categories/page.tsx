"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useRestaurant } from "@/lib/restaurant-context";

export default function CategoriesPage() {
  const { active } = useRestaurant();
  const { data: menu } = useQuery({
    queryKey: ["menu", active?.id],
    queryFn: () => api.restaurants.menu(active.id),
    enabled: !!active,
  });

  if (!active) return <p className="opacity-60">No restaurant found for this account.</p>;

  return (
    <div className="max-w-lg space-y-3">
      <h1 className="text-xl font-bold mb-2">Categories</h1>
      <p className="text-sm opacity-60 mb-4">
        Add categories from the main Menu page. Drag-to-reorder is planned for a future pass.
      </p>
      {((menu as any[]) ?? []).map((c, i) => (
        <div key={c.id} className="glass-card p-3 flex items-center justify-between text-sm">
          <span>{c.name}</span>
          <span className="opacity-50 text-xs">#{i + 1} · {c.dishes.length} dishes</span>
        </div>
      ))}
    </div>
  );
}
