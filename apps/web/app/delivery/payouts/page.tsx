"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api, apiClient } from "@/lib/api";

export default function PayoutsPage() {
  const { data: earnings } = useQuery({ queryKey: ["driver-earnings"], queryFn: () => api.delivery.earnings() });
  const { data: profile } = useQuery({ queryKey: ["driver-me"], queryFn: () => apiClient.get<any>("/drivers/me") });
  const [transferred, setTransferred] = useState(false);

  const available = (earnings as any)?.total ?? 0;
  const cod = (profile as any)?.codCashInHand ?? 0;

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold">Instant Payouts</h1>

      <div className="glass-card p-5">
        <div className="text-xs opacity-60 mb-1">Available Balance</div>
        <div className="text-2xl font-bold mb-3">₹{available.toFixed(2)}</div>
        <button
          onClick={() => setTransferred(true)}
          className="portal-btn-primary px-4 py-2 text-sm"
          disabled={transferred}
        >
          {transferred ? "Transfer initiated ✓" : "Instant Transfer (IMPS/UPI)"}
        </button>
      </div>

      <div className="glass-card p-5 flex items-center justify-between">
        <span className="text-sm font-medium">COD Cash in Hand</span>
        <span className="font-bold" style={{ color: cod > 2000 ? "#e74040" : "var(--portal-primary)" }}>
          ₹{cod.toFixed(2)}
        </span>
      </div>
      {cod > 2000 && (
        <p className="text-xs text-red-500">
          You're above the recommended COD limit — please deposit cash soon.
        </p>
      )}
    </div>
  );
}
