"use client";

import { useState } from "react";
import { DELIVERY_FEE_BASE, DELIVERY_FEE_PER_KM, PLATFORM_FEE, SURGE_MULTIPLIERS } from "@quickbite/config";

export default function OperationsPage() {
  const [baseFee, setBaseFee] = useState(DELIVERY_FEE_BASE);
  const [perKm, setPerKm] = useState(DELIVERY_FEE_PER_KM);
  const [platformFee, setPlatformFee] = useState(PLATFORM_FEE);
  const [rainSurge, setRainSurge] = useState(false);
  const [nightSurge, setNightSurge] = useState(true);

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-bold">Dynamic Pricing & Operations</h1>
      <p className="text-xs opacity-60">
        UI-only in this build — persisting these to a live-config service is planned for a future
        pass. Current values shown are the platform defaults from @quickbite/config.
      </p>

      <div className="glass-card p-4 space-y-3 text-sm">
        <Field label="Base Delivery Fee (₹)" value={baseFee} onChange={setBaseFee} />
        <Field label="Per-KM Rate (₹)" value={perKm} onChange={setPerKm} />
        <Field label="Platform Service Fee (₹)" value={platformFee} onChange={setPlatformFee} />
      </div>

      <div className="glass-card p-4 space-y-2 text-sm">
        <label className="flex items-center justify-between">
          Rain Surge
          <input type="checkbox" checked={rainSurge} onChange={(e) => setRainSurge(e.target.checked)} />
        </label>
        <label className="flex items-center justify-between">
          Night Surge
          <input type="checkbox" checked={nightSurge} onChange={(e) => setNightSurge(e.target.checked)} />
        </label>
        <div className="text-xs opacity-60 pt-2">
          Multiplier tiers: {Object.entries(SURGE_MULTIPLIERS).map(([k, v]) => `${k}=${v}x`).join(", ")}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-20 glass-card px-2 py-1 text-right"
      />
    </div>
  );
}
