"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const { data: restaurants } = useQuery({ queryKey: ["admin-restaurants"], queryFn: () => api.admin.restaurants() });
  const [restaurantId, setRestaurantId] = useState("");
  const [newName, setNewName] = useState("");

  const { data: menu, isLoading } = useQuery({
    queryKey: ["admin-menu", restaurantId],
    queryFn: () => api.restaurants.menu(restaurantId),
    enabled: !!restaurantId,
  });
  const categories = (menu as any[]) ?? [];

  async function createCategory() {
    if (!restaurantId || !newName.trim()) return;
    await api.menu.createCategory(restaurantId, { name: newName.trim() });
    setNewName("");
    qc.invalidateQueries({ queryKey: ["admin-menu", restaurantId] });
  }

  async function rename(categoryId: string, currentName: string) {
    const name = prompt("Category name", currentName);
    if (!name || name === currentName) return;
    await api.menu.updateCategory(categoryId, { name });
    qc.invalidateQueries({ queryKey: ["admin-menu", restaurantId] });
  }

  async function remove(categoryId: string) {
    if (!confirm("Delete this category? Dishes inside it are not deleted.")) return;
    await api.menu.deleteCategory(categoryId);
    qc.invalidateQueries({ queryKey: ["admin-menu", restaurantId] });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-bold">Food Categories</h1>
      <p className="text-xs opacity-60">
        Categories belong to a restaurant's menu — pick a restaurant to manage its category list.
        This reuses the same endpoints restaurant owners already use, with admin authorization.
      </p>

      <select
        value={restaurantId}
        onChange={(e) => setRestaurantId(e.target.value)}
        className="w-full glass-card px-3 py-2 text-sm"
      >
        <option value="">Select a restaurant…</option>
        {((restaurants as any[]) ?? []).map((r) => (
          <option key={r.id} value={r.id}>{r.name}</option>
        ))}
      </select>

      {restaurantId && (
        <>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New category name"
              className="flex-1 glass-card px-3 py-2 text-sm"
            />
            <button onClick={createCategory} className="portal-btn-primary px-4 py-2 text-sm">Add</button>
          </div>

          <div className="space-y-2">
            {categories.map((c: any) => (
              <div key={c.id} className="glass-card p-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-semibold">{c.name}</span>
                  <span className="opacity-60 text-xs ml-2">{c.dishes?.length ?? 0} dishes</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => rename(c.id, c.name)} className="qb-admin-badge qb-admin-badge-primary">Rename</button>
                  <button onClick={() => remove(c.id)} className="qb-admin-badge qb-admin-badge-error">Delete</button>
                </div>
              </div>
            ))}
            {!isLoading && categories.length === 0 && <p className="opacity-60 text-sm">No categories yet.</p>}
          </div>
        </>
      )}
    </div>
  );
}
