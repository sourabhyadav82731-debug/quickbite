"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { DietaryTag } from "@quickbite/types";
import { api, apiClient, uploadImage, API_URL, friendlyErrorMessage } from "@/lib/api";
import { useRestaurant } from "@/lib/restaurant-context";
import { DishEditModal } from "@/components/dish-edit-modal";

function resolveUrl(url?: string | null) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_URL}${url}`;
}

export default function MenuPage() {
  const { active } = useRestaurant();
  const qc = useQueryClient();
  const { data: menu } = useQuery({
    queryKey: ["menu", active?.id],
    queryFn: () => api.restaurants.menu(active.id),
    enabled: !!active,
  });

  const [newCategory, setNewCategory] = useState("");
  const [dishForm, setDishForm] = useState<Record<string, any>>({});
  const [showDishForm, setShowDishForm] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editingDish, setEditingDish] = useState<any | null>(null);

  const allCategories = ((menu as any[]) ?? []).map((c) => ({ id: c.id, name: c.name }));

  async function addCategory() {
    if (!newCategory) return;
    await api.menu.createCategory(active.id, { name: newCategory, sortOrder: 0 });
    setNewCategory("");
    qc.invalidateQueries({ queryKey: ["menu", active.id] });
  }

  async function addDish(categoryId: string) {
    const form = dishForm[categoryId];
    if (!form?.name || !form?.price) return;
    setCreating(true);
    setCreateError(null);
    try {
      const dish: any = await api.menu.createDish(active.id, {
        categoryId,
        name: form.name,
        description: form.description ?? "",
        price: Number(form.price),
        dietaryTags: form.veg ? [DietaryTag.VEG] : [DietaryTag.NON_VEG],
        isInStock: true,
      });
      // Photo is optional at creation — if one was picked, attach it to the
      // dish id we just got back rather than blocking dish creation on the
      // upload succeeding.
      if (form.photoFile) {
        await uploadImage(`/dishes/${dish.id}/photo`, form.photoFile);
      }
      setDishForm({ ...dishForm, [categoryId]: {} });
      setShowDishForm(null);
      qc.invalidateQueries({ queryKey: ["menu", active.id] });
    } catch (err) {
      setCreateError(friendlyErrorMessage(err, "Failed to create dish"));
    } finally {
      setCreating(false);
    }
  }

  async function toggleStock(dishId: string, isInStock: boolean) {
    await apiClient.patch(`/dishes/${dishId}/stock`, { isInStock: !isInStock });
    qc.invalidateQueries({ queryKey: ["menu", active.id] });
  }

  async function deleteDish(dishId: string, name: string) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await api.menu.deleteDish(dishId);
    qc.invalidateQueries({ queryKey: ["menu", active.id] });
  }

  if (!active) return <p className="opacity-60">No restaurant found for this account.</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Menu — {active.name}</h1>
      </div>

      <div className="glass-card p-4 flex gap-2">
        <input
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New category name"
          className="flex-1 glass-card px-3 py-2 text-sm"
        />
        <button onClick={addCategory} className="portal-btn-primary px-4 py-2 text-sm">
          + Category
        </button>
      </div>

      {((menu as any[]) ?? []).map((category) => (
        <section key={category.id} className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">{category.name}</h2>
            <button
              onClick={() => setShowDishForm(showDishForm === category.id ? null : category.id)}
              className="text-xs px-3 py-1 rounded-lg glass-card"
            >
              + Dish
            </button>
          </div>

          {showDishForm === category.id && (
            <div className="mb-3 space-y-2 p-3 rounded-lg" style={{ background: "var(--portal-border)" }}>
              <input
                placeholder="Dish name"
                value={dishForm[category.id]?.name ?? ""}
                onChange={(e) =>
                  setDishForm({ ...dishForm, [category.id]: { ...dishForm[category.id], name: e.target.value } })
                }
                className="w-full glass-card px-2 py-1.5 text-sm"
              />
              <input
                placeholder="Description"
                value={dishForm[category.id]?.description ?? ""}
                onChange={(e) =>
                  setDishForm({
                    ...dishForm,
                    [category.id]: { ...dishForm[category.id], description: e.target.value },
                  })
                }
                className="w-full glass-card px-2 py-1.5 text-sm"
              />
              <div className="flex gap-2 items-center">
                <input
                  placeholder="Price"
                  type="number"
                  value={dishForm[category.id]?.price ?? ""}
                  onChange={(e) =>
                    setDishForm({ ...dishForm, [category.id]: { ...dishForm[category.id], price: e.target.value } })
                  }
                  className="w-24 glass-card px-2 py-1.5 text-sm"
                />
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={dishForm[category.id]?.veg ?? true}
                    onChange={(e) =>
                      setDishForm({ ...dishForm, [category.id]: { ...dishForm[category.id], veg: e.target.checked } })
                    }
                  />
                  Veg
                </label>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs glass-card px-2 py-1.5 rounded-lg cursor-pointer">
                  {dishForm[category.id]?.photoFile ? "Photo selected" : "+ Photo (optional)"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) =>
                      setDishForm({
                        ...dishForm,
                        [category.id]: { ...dishForm[category.id], photoFile: e.target.files?.[0] },
                      })
                    }
                  />
                </label>
                <button
                  onClick={() => addDish(category.id)}
                  disabled={creating}
                  className="portal-btn-primary px-3 py-1.5 text-xs ml-auto disabled:opacity-50"
                >
                  {creating ? "Saving…" : "Save Dish"}
                </button>
              </div>
              {createError && <p className="text-red-500 text-xs">{createError}</p>}
            </div>
          )}

          <div className="space-y-2">
            {category.dishes.map((dish: any) => (
              <div key={dish.id} className="flex items-center gap-3 text-sm py-1.5">
                <div
                  className="w-11 h-11 rounded-lg overflow-hidden shrink-0"
                  style={{ background: "var(--qb-elevated)" }}
                >
                  {dish.imageUrl ? (
                    <img
                      src={resolveUrl(dish.imageUrl) ?? ""}
                      alt={dish.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm opacity-40">🍽️</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{dish.name}</div>
                  <div className="opacity-60 text-xs">₹{dish.price}</div>
                </div>
                <button
                  onClick={() => setEditingDish(dish)}
                  className="text-xs px-2.5 py-1.5 rounded-lg glass-card shrink-0"
                  style={{ minHeight: 32 }}
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleStock(dish.id, dish.isInStock)}
                  className="text-xs px-2 py-1.5 rounded-lg shrink-0"
                  style={{
                    background: dish.isInStock ? "#00B89422" : "#e7404022",
                    color: dish.isInStock ? "#00B894" : "#e74040",
                  }}
                >
                  {dish.isInStock ? "In Stock" : "Out of Stock"}
                </button>
                <button
                  onClick={() => deleteDish(dish.id, dish.name)}
                  className="text-xs px-2 py-1.5 rounded-lg shrink-0"
                  style={{ color: "var(--qb-error)", minHeight: 32 }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}

      {editingDish && (
        <DishEditModal
          dish={editingDish}
          categories={allCategories}
          onClose={() => setEditingDish(null)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["menu", active.id] })}
        />
      )}
    </div>
  );
}
