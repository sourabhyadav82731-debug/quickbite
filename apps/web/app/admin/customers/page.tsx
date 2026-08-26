"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function AdminCustomersPage() {
  const { data } = useQuery({ queryKey: ["admin-customers"], queryFn: () => api.admin.customers() });

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Customer Management</h1>
      <div className="glass-card divide-y" style={{ borderColor: "var(--portal-border)" }}>
        {((data as any[]) ?? []).map((c) => (
          <div key={c.id} className="p-4 flex items-center justify-between text-sm">
            <div>
              <div className="font-semibold">{c.name}</div>
              <div className="opacity-60 text-xs">{c.email}</div>
            </div>
            <div className="text-xs opacity-70">Wallet ₹{c.walletBalance}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
