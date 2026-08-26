"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiClient } from "@/lib/api";
import { useRestaurant } from "@/lib/restaurant-context";

export default function ReviewsPage() {
  const { active } = useRestaurant();
  const qc = useQueryClient();
  const { data: reviews } = useQuery({
    queryKey: ["reviews", active?.id],
    queryFn: () => apiClient.get<any[]>(`/reviews/restaurant/${active.id}`),
    enabled: !!active,
  });
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  async function reply(id: string) {
    await apiClient.patch(`/reviews/${id}/reply`, { reply: replyDrafts[id] });
    qc.invalidateQueries({ queryKey: ["reviews", active.id] });
  }

  if (!active) return <p className="opacity-60">No restaurant found for this account.</p>;

  const list = (reviews as any[]) ?? [];
  const avg = (key: string) =>
    list.length ? (list.reduce((s, r) => s + (r[key] ?? 0), 0) / list.length).toFixed(1) : "-";

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-bold">Reviews & Reputation</h1>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="glass-card p-3">
          <div className="text-xs opacity-60">Food</div>
          <div className="font-bold">★ {avg("foodRating")}</div>
        </div>
        <div className="glass-card p-3">
          <div className="text-xs opacity-60">Packaging</div>
          <div className="font-bold">★ {avg("packagingRating")}</div>
        </div>
        <div className="glass-card p-3">
          <div className="text-xs opacity-60">Delivery</div>
          <div className="font-bold">★ {avg("deliveryRating")}</div>
        </div>
      </div>

      <div className="space-y-3">
        {list.map((r) => (
          <div key={r.id} className="glass-card p-4 text-sm">
            <div className="font-semibold mb-1">★ {r.foodRating} food quality</div>
            {r.comment && <p className="opacity-70 mb-2">"{r.comment}"</p>}
            {r.ownerReply ? (
              <p className="text-xs opacity-60 pl-3 border-l-2" style={{ borderColor: "var(--portal-primary)" }}>
                Reply: {r.ownerReply}
              </p>
            ) : (
              <div className="flex gap-2 mt-2">
                <input
                  placeholder="Write a reply..."
                  value={replyDrafts[r.id] ?? ""}
                  onChange={(e) => setReplyDrafts({ ...replyDrafts, [r.id]: e.target.value })}
                  className="flex-1 glass-card px-2 py-1.5 text-xs"
                />
                <button onClick={() => reply(r.id)} className="portal-btn-primary px-3 py-1.5 text-xs">
                  Reply
                </button>
              </div>
            )}
          </div>
        ))}
        {list.length === 0 && <p className="opacity-60 text-sm">No reviews yet.</p>}
      </div>
    </div>
  );
}
