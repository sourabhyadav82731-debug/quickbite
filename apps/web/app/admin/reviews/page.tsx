"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function AdminReviewsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"" | "visible" | "hidden">("");
  const query = filter ? `?visible=${filter}` : "";
  const { data, isLoading } = useQuery({
    queryKey: ["admin-reviews", filter],
    queryFn: () => api.admin.reviews(query),
  });
  const reviews = (data as any[]) ?? [];

  async function toggle(id: string, isHidden: boolean) {
    await api.admin.setReviewVisibility(id, !isHidden);
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Reviews Moderation</h1>
      <p className="text-xs opacity-60">
        Ratings and review text are exactly as customers wrote them — moderation only controls
        whether a review is visible on the public listing, never its content or score.
      </p>

      <div className="flex gap-2">
        {(["", "visible", "hidden"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`qb-admin-badge px-3 py-1.5 ${filter === f ? "qb-admin-badge-primary" : ""}`}
          >
            {f === "" ? "All" : f === "visible" ? "Visible" : "Hidden"}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {reviews.map((r: any) => (
          <div key={r.id} className="glass-card p-4 text-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold">★ {r.foodRating}</span>
              <button
                onClick={() => toggle(r.id, r.isHidden)}
                className={`qb-admin-badge ${r.isHidden ? "qb-admin-badge-error" : "qb-admin-badge-success"}`}
              >
                {r.isHidden ? "Hidden" : "Visible"}
              </button>
            </div>
            {r.comment && <p className="opacity-80">{r.comment}</p>}
            <div className="text-xs opacity-60">Order #{r.orderId.slice(0, 8)} · {new Date(r.createdAt).toLocaleDateString()}</div>
          </div>
        ))}
        {!isLoading && reviews.length === 0 && <p className="opacity-60 text-sm">No reviews yet.</p>}
      </div>
    </div>
  );
}
