"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { useRestaurant } from "@/lib/restaurant-context";

export default function AddonsPage() {
  const { active } = useRestaurant();
  const qc = useQueryClient();
  const { data: menu } = useQuery({
    queryKey: ["menu", active?.id],
    queryFn: () => api.restaurants.menu(active.id),
    enabled: !!active,
  });

  const [openDish, setOpenDish] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [required, setRequired] = useState(false);
  const [maxSelect, setMaxSelect] = useState(1);
  const [addonRows, setAddonRows] = useState([{ name: "", price: "" }]);

  async function save(dishId: string) {
    await api.menu.createAddonGroup(dishId, {
      dishId,
      name: groupName,
      isRequired: required,
      minSelect: required ? 1 : 0,
      maxSelect,
      addons: addonRows
        .filter((a) => a.name)
        .map((a) => ({ name: a.name, price: Number(a.price) || 0 })),
    });
    setOpenDish(null);
    setGroupName("");
    setAddonRows([{ name: "", price: "" }]);
    qc.invalidateQueries({ queryKey: ["menu", active.id] });
  }

  if (!active) return <p className="opacity-60">No restaurant found for this account.</p>;

  const dishes = ((menu as any[]) ?? []).flatMap((c) => c.dishes);

  return (
    <div className="max-w-2xl space-y-3">
      <h1 className="text-xl font-bold mb-2">Addon Groups</h1>
      {dishes.map((dish) => (
        <div key={dish.id} className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">{dish.name}</div>
              <div className="text-xs opacity-60">
                {dish.addonGroups?.length ?? 0} addon group(s)
              </div>
            </div>
            <button
              onClick={() => setOpenDish(openDish === dish.id ? null : dish.id)}
              className="text-xs px-3 py-1.5 rounded-lg glass-card"
            >
              + Add Group
            </button>
          </div>

          {openDish === dish.id && (
            <div className="mt-3 space-y-2 p-3 rounded-lg" style={{ background: "var(--portal-border)" }}>
              <input
                placeholder="Group name (e.g. Size, Toppings)"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full glass-card px-2 py-1.5 text-sm"
              />
              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
                  Mandatory
                </label>
                <label className="flex items-center gap-1">
                  Max select
                  <input
                    type="number"
                    min={1}
                    value={maxSelect}
                    onChange={(e) => setMaxSelect(Number(e.target.value))}
                    className="w-14 glass-card px-1 py-0.5"
                  />
                </label>
              </div>
              {addonRows.map((row, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    placeholder="Addon name"
                    value={row.name}
                    onChange={(e) => {
                      const next = [...addonRows];
                      next[i] = { ...next[i], name: e.target.value };
                      setAddonRows(next);
                    }}
                    className="flex-1 glass-card px-2 py-1.5 text-sm"
                  />
                  <input
                    placeholder="Price"
                    type="number"
                    value={row.price}
                    onChange={(e) => {
                      const next = [...addonRows];
                      next[i] = { ...next[i], price: e.target.value };
                      setAddonRows(next);
                    }}
                    className="w-20 glass-card px-2 py-1.5 text-sm"
                  />
                </div>
              ))}
              <button
                onClick={() => setAddonRows([...addonRows, { name: "", price: "" }])}
                className="text-xs underline opacity-70"
              >
                + another addon
              </button>
              <button onClick={() => save(dish.id)} className="portal-btn-primary px-4 py-1.5 text-xs block">
                Save Group
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
