"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function AdminRestaurantsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-restaurants"], queryFn: () => api.admin.restaurants() });

  async function approve(id: string) {
    await api.admin.approveRestaurant(id);
    qc.invalidateQueries({ queryKey: ["admin-restaurants"] });
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Restaurant Management</h1>
      <div className="space-y-2">
        {((data as any[]) ?? []).map((r) => (
          <div key={r.id} className="glass-card p-4 flex items-center justify-between text-sm">
            <div>
              <div className="font-semibold">{r.name}</div>
              <div className="opacity-60 text-xs">
                {r.cuisines.join(", ")} · Commission {(r.commissionRate * 100).toFixed(0)}%
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: r.status === "ACTIVE" ? "#00B89422" : r.status === "PENDING_APPROVAL" ? "#FFB53422" : "#e7404022",
                  color: r.status === "ACTIVE" ? "#00B894" : r.status === "PENDING_APPROVAL" ? "#FFB534" : "#e74040",
                }}
              >
                {r.status}
              </span>
              {r.status === "PENDING_APPROVAL" && (
                <button onClick={() => approve(r.id)} className="portal-btn-primary px-3 py-1.5 text-xs">
                  Approve
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
