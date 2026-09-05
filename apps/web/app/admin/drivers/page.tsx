"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function AdminDriversPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-drivers"], queryFn: () => api.admin.drivers() });
  const drivers = (data as any[]) ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Driver Management</h1>
      <div className="qb-admin-table-wrap">
        <table className="qb-admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Current Delivery</th>
              <th>Trips</th>
              <th>Rating</th>
              <th>Acceptance</th>
              <th>Total Earnings</th>
              <th>Pending Payout</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d: any) => (
              <tr key={d.userId} onClick={() => (window.location.href = `/admin/drivers/${d.userId}`)}>
                <td className="font-semibold">{d.name ?? "—"}</td>
                <td>{d.phone ?? "—"}</td>
                <td>
                  <span className={`qb-admin-badge ${d.isOnline ? "qb-admin-badge-success" : ""}`}>
                    {d.isOnline ? "Online" : "Offline"}
                  </span>
                  {!d.isActive && <span className="qb-admin-badge qb-admin-badge-error ml-1">Suspended</span>}
                </td>
                <td className="font-mono text-xs">
                  {d.currentDeliveryOrderId ? `#${d.currentDeliveryOrderId.slice(0, 8)}` : "—"}
                </td>
                <td>{d.trips}</td>
                <td>★ {Number(d.rating).toFixed(1)}</td>
                <td>{d.acceptanceRate}%</td>
                <td>₹{Number(d.totalEarnings).toFixed(0)}</td>
                <td>₹{Number(d.pendingPayout).toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && drivers.length === 0 && <p className="opacity-60 text-sm p-4">No drivers yet.</p>}
      </div>
    </div>
  );
}
