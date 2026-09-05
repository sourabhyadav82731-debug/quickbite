"use client";

import { useEffect, useState } from "react";

const STALE_AFTER_MS = 30000;

function formatAgo(seconds: number) {
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ago`;
}

/** "🔴 LIVE / Updated Xs ago" — or an explicit stale/unavailable state,
 *  never a silently-frozen "LIVE" label next to a position that stopped
 *  updating minutes ago. Ticks on its own (setInterval) purely to keep the
 *  "Xs ago" text current — it never re-derives the location itself. */
export function LiveTrackingBadge({
  socketConnected,
  locationUpdatedAt,
}: {
  socketConnected: boolean;
  locationUpdatedAt: string | null;
}) {
  const [, forceTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!locationUpdatedAt) {
    return <span className="text-[10px] opacity-50">Waiting for driver location…</span>;
  }

  const ageMs = Date.now() - new Date(locationUpdatedAt).getTime();
  const isStale = ageMs > STALE_AFTER_MS || !socketConnected;

  if (isStale) {
    return (
      <span className="text-[10px] font-semibold" style={{ color: "var(--qb-warning)" }}>
        Location temporarily unavailable
      </span>
    );
  }

  return (
    <span className="text-[10px] font-semibold" style={{ color: "var(--qb-success)" }}>
      🔴 LIVE · Updated {formatAgo(Math.max(0, Math.floor(ageMs / 1000)))}
    </span>
  );
}
