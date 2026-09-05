"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, friendlyErrorMessage } from "@/lib/api";

const PAUSE_REASONS = ["Busy", "Kitchen maintenance", "Short staff", "Custom"];

const STATUS_META: Record<string, { label: string; dot: string; color: string }> = {
  OPEN: { label: "OPEN", dot: "●", color: "var(--qb-success)" },
  CLOSED: { label: "CLOSED", dot: "●", color: "var(--qb-error)" },
  PAUSED: { label: "PAUSED", dot: "⏸", color: "var(--qb-warning)" },
};

/** OPEN/CLOSED/PAUSED — persisted via PATCH /restaurants/:id/availability,
 *  enforced server-side at checkout (see OrdersService.checkout). This is
 *  the single control surface for that state; the older isAcceptingOrders
 *  toggle in the topbar (OutletSwitcher) still works and now just flips
 *  between OPEN/CLOSED through the same backend field. */
export function AvailabilityControl({ restaurant }: { restaurant: any }) {
  const qc = useQueryClient();
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [customReason, setCustomReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = restaurant.availabilityStatus ?? (restaurant.isAcceptingOrders ? "OPEN" : "CLOSED");
  const meta = STATUS_META[status] ?? STATUS_META.CLOSED;

  async function setStatus(availabilityStatus: string, pauseReason?: string) {
    setSaving(true);
    setError(null);
    try {
      await api.restaurants.setAvailability(restaurant.id, { availabilityStatus, pauseReason });
      qc.invalidateQueries({ queryKey: ["my-restaurants"] });
      setShowPauseMenu(false);
    } catch (err) {
      setError(friendlyErrorMessage(err, "Could not update availability"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="text-sm font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5"
          style={{ background: `${meta.color}22`, color: meta.color }}
        >
          <span>{meta.dot}</span> {meta.label}
        </span>
        {status === "PAUSED" && restaurant.pauseReason && (
          <span className="text-xs opacity-60">({restaurant.pauseReason})</span>
        )}

        {status !== "OPEN" ? (
          <button
            onClick={() => setStatus("OPEN")}
            disabled={saving}
            className="portal-btn-primary px-3 py-1.5 text-xs rounded-lg disabled:opacity-50"
            style={{ minHeight: 36 }}
          >
            Open
          </button>
        ) : (
          <button
            onClick={() => setStatus("CLOSED")}
            disabled={saving}
            className="qb-btn-secondary px-3 py-1.5 text-xs rounded-lg disabled:opacity-50"
            style={{ minHeight: 36 }}
          >
            Close
          </button>
        )}
        {status !== "PAUSED" && (
          <button
            onClick={() => setShowPauseMenu((v) => !v)}
            disabled={saving}
            className="qb-btn-secondary px-3 py-1.5 text-xs rounded-lg disabled:opacity-50"
            style={{ minHeight: 36 }}
          >
            Pause Orders
          </button>
        )}
        {status === "PAUSED" && (
          <button
            onClick={() => setStatus("OPEN")}
            disabled={saving}
            className="qb-btn-secondary px-3 py-1.5 text-xs rounded-lg disabled:opacity-50"
            style={{ minHeight: 36 }}
          >
            Resume
          </button>
        )}
      </div>

      {showPauseMenu && (
        <div className="glass-card p-3 space-y-2 max-w-xs">
          <p className="text-xs opacity-70">Why are you pausing?</p>
          <div className="flex gap-1.5 flex-wrap">
            {PAUSE_REASONS.map((r) => (
              <button
                key={r}
                onClick={() => (r === "Custom" ? null : setStatus("PAUSED", r))}
                className="text-xs px-2.5 py-1.5 rounded-lg glass-card"
                style={{ minHeight: 32 }}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Custom reason"
              className="flex-1 glass-card px-2 py-1.5 text-xs"
            />
            <button
              onClick={() => customReason.trim() && setStatus("PAUSED", customReason.trim())}
              disabled={!customReason.trim() || saving}
              className="portal-btn-primary px-3 py-1.5 text-xs rounded-lg disabled:opacity-50"
            >
              Pause
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
