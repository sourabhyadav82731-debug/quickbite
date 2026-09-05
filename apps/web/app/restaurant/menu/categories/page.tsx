"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, friendlyErrorMessage } from "@/lib/api";
import { useRestaurant } from "@/lib/restaurant-context";

export default function CategoriesPage() {
  const { active } = useRestaurant();
  const qc = useQueryClient();
  const { data: menu } = useQuery({
    queryKey: ["menu", active?.id],
    queryFn: () => api.restaurants.menu(active.id),
    enabled: !!active,
  });
  const [newCategory, setNewCategory] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categories = ((menu as any[]) ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["menu", active.id] });
  }

  async function createCategory() {
    if (!newCategory.trim() || !active) return;
    setError(null);
    try {
      await api.menu.createCategory(active.id, { name: newCategory.trim(), sortOrder: categories.length });
      setNewCategory("");
      invalidate();
    } catch (err) {
      setError(friendlyErrorMessage(err, "Could not create category"));
    }
  }

  async function saveRename(id: string) {
    if (!renameValue.trim()) return;
    setBusyId(id);
    setError(null);
    try {
      await api.menu.updateCategory(id, { name: renameValue.trim() });
      setRenaming(null);
      invalidate();
    } catch (err) {
      setError(friendlyErrorMessage(err, "Could not rename category"));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await api.menu.deleteCategory(id);
      invalidate();
    } catch (err) {
      setError(friendlyErrorMessage(err, "Could not delete category"));
    } finally {
      setBusyId(null);
    }
  }

  async function move(id: string, direction: -1 | 1) {
    const idx = categories.findIndex((c) => c.id === id);
    const swapWith = idx + direction;
    if (swapWith < 0 || swapWith >= categories.length || !active) return;
    const orderedIds = categories.map((c) => c.id);
    [orderedIds[idx], orderedIds[swapWith]] = [orderedIds[swapWith], orderedIds[idx]];
    setBusyId(id);
    setError(null);
    try {
      await api.menu.reorderCategories(active.id, orderedIds);
      invalidate();
    } catch (err) {
      setError(friendlyErrorMessage(err, "Could not reorder categories"));
    } finally {
      setBusyId(null);
    }
  }

  if (!active) return <p className="opacity-60">No restaurant found for this account.</p>;

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <h1 className="text-xl font-bold mb-1">Categories</h1>
        <p className="text-sm opacity-60">Organize your menu — reorder, rename, or add new sections.</p>
      </div>

      <div className="glass-card p-3 flex gap-2">
        <input
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New category name"
          className="flex-1 glass-card px-3 py-2 text-sm"
        />
        <button onClick={createCategory} className="portal-btn-primary px-4 py-2 text-sm rounded-lg" style={{ minHeight: 44 }}>
          + Category
        </button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="space-y-2">
        {categories.map((c, i) => (
          <div key={c.id} className="glass-card p-3 flex items-center gap-2 text-sm">
            <div className="flex flex-col">
              <button
                onClick={() => move(c.id, -1)}
                disabled={i === 0 || busyId === c.id}
                className="opacity-60 disabled:opacity-20 leading-none"
                style={{ minWidth: 24, minHeight: 22 }}
                aria-label={`Move ${c.name} up`}
              >
                ▲
              </button>
              <button
                onClick={() => move(c.id, 1)}
                disabled={i === categories.length - 1 || busyId === c.id}
                className="opacity-60 disabled:opacity-20 leading-none"
                style={{ minWidth: 24, minHeight: 22 }}
                aria-label={`Move ${c.name} down`}
              >
                ▼
              </button>
            </div>

            {renaming === c.id ? (
              <input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="flex-1 glass-card px-2 py-1.5 text-sm"
                autoFocus
              />
            ) : (
              <span className="flex-1">{c.name}</span>
            )}

            <span className="opacity-50 text-xs whitespace-nowrap">{c.dishes.length} dish{c.dishes.length === 1 ? "" : "es"}</span>

            {renaming === c.id ? (
              <>
                <button onClick={() => saveRename(c.id)} disabled={busyId === c.id} className="text-xs portal-btn-primary px-2 py-1.5 rounded-lg" style={{ minHeight: 32 }}>
                  Save
                </button>
                <button onClick={() => setRenaming(null)} className="text-xs opacity-60" style={{ minWidth: 44, minHeight: 32 }}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setRenaming(c.id);
                    setRenameValue(c.name);
                  }}
                  className="text-xs px-2 py-1.5 rounded-lg glass-card"
                  style={{ minHeight: 32 }}
                >
                  Rename
                </button>
                <button
                  onClick={() => remove(c.id)}
                  disabled={busyId === c.id || c.dishes.length > 0}
                  title={c.dishes.length > 0 ? "Move or delete its dishes first" : undefined}
                  className="text-xs px-2 py-1.5 rounded-lg disabled:opacity-30"
                  style={{ color: "var(--qb-error)", minHeight: 32 }}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        ))}
        {categories.length === 0 && <p className="text-sm opacity-60">No categories yet — add one above.</p>}
      </div>
    </div>
  );
}
