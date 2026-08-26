"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { DeliveryStage } from "@quickbite/types";
import { api, apiClient } from "@/lib/api";

const STAGE_FLOW: { stage: DeliveryStage; label: string; needsOtp?: "pickup" | "drop" }[] = [
  { stage: DeliveryStage.ASSIGNED, label: "Navigate to Restaurant" },
  { stage: DeliveryStage.ARRIVED_AT_RESTAURANT, label: "Arrived — Verify Order" },
  { stage: DeliveryStage.PICKED_UP, label: "Picked Up (enter restaurant OTP)", needsOtp: "pickup" },
  { stage: DeliveryStage.OUT_FOR_DELIVERY, label: "Navigate to Customer" },
  { stage: DeliveryStage.ARRIVED_AT_CUSTOMER, label: "Arrived at Customer" },
  { stage: DeliveryStage.DELIVERED, label: "Complete Delivery (enter customer OTP)", needsOtp: "drop" },
];

export default function ActiveDeliveryPage() {
  const qc = useQueryClient();
  const { data: activeList } = useQuery({
    queryKey: ["driver-active"],
    queryFn: () => apiClient.get<any[]>("/deliveries/active"),
    refetchInterval: 5000,
  });
  const delivery = ((activeList as any[]) ?? [])[0];
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [codCollected, setCodCollected] = useState(false);
  const driftRef = useRef({ lat: 12.968, lng: 77.6 });

  useEffect(() => {
    if (!delivery || delivery.stage !== DeliveryStage.OUT_FOR_DELIVERY) return;
    const interval = setInterval(() => {
      driftRef.current = {
        lat: driftRef.current.lat + (Math.random() - 0.5) * 0.002,
        lng: driftRef.current.lng + (Math.random() - 0.5) * 0.002,
      };
      api.delivery.updateLocation(delivery.id, driftRef.current).catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, [delivery]);

  if (!delivery) {
    return (
      <div className="glass-card p-10 text-center opacity-60">
        No active delivery. Accept an incoming request to get started.
      </div>
    );
  }

  const currentIdx = STAGE_FLOW.findIndex((s) => s.stage === delivery.stage);
  const next = STAGE_FLOW[currentIdx + 1];

  async function advance() {
    setError(null);
    try {
      await api.delivery.advanceStage(delivery.id, {
        stage: next.stage,
        otp: next.needsOtp ? otp : undefined,
      });
      setOtp("");
      qc.invalidateQueries({ queryKey: ["driver-active"] });
    } catch (err: any) {
      setError(err?.message ?? "Failed to advance");
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-5">
      <h1 className="text-xl font-bold">Active Delivery</h1>

      <div className="glass-card p-4 space-y-1 text-sm">
        {STAGE_FLOW.map((s, i) => (
          <div key={s.stage} className="flex items-center gap-2">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white"
              style={{ background: i <= currentIdx ? "var(--portal-primary)" : "var(--portal-border)" }}
            >
              {i <= currentIdx ? "✓" : i + 1}
            </span>
            <span className={i <= currentIdx ? "font-medium" : "opacity-50"}>{s.label}</span>
          </div>
        ))}
      </div>

      {delivery.stage === DeliveryStage.ARRIVED_AT_CUSTOMER && (
        <label className="flex items-center gap-2 text-sm glass-card p-3">
          <input type="checkbox" checked={codCollected} onChange={(e) => setCodCollected(e.target.checked)} />
          Cash on Delivery collected
        </label>
      )}

      {next?.needsOtp && (
        <input
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder={`Enter ${next.needsOtp} OTP`}
          maxLength={4}
          className="w-full glass-card px-3 py-3 text-center text-lg tracking-widest"
        />
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {next && (
        <button onClick={advance} className="portal-btn-primary w-full py-3 text-sm">
          {next.label}
        </button>
      )}

      {!next && <p className="text-center opacity-60 text-sm">Delivery complete 🎉</p>}

      <button
        onClick={() => alert("Reported: Restaurant closed / Item spilled / Customer unreachable / Vehicle issue (simulated)")}
        className="w-full py-2 text-xs opacity-60 underline"
      >
        Report a problem
      </button>
    </div>
  );
}
