"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "qb-admin-badge-success",
  PENDING_APPROVAL: "qb-admin-badge-warning",
  SUSPENDED: "qb-admin-badge-error",
};

export default function AdminRestaurantsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-restaurants"], queryFn: () => api.admin.restaurants() });
  const restaurants = (data as any[]) ?? [];

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["admin-restaurants"] });
  }

  async function approve(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await api.admin.approveRestaurant(id);
    invalidate();
  }
  async function suspend(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Suspend this restaurant? It will stop accepting new orders.")) return;
    await api.admin.suspendRestaurant(id);
    invalidate();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Restaurant Management</h1>
      <div className="qb-admin-table-wrap">
        <table className="qb-admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Open/Closed</th>
              <th>Rating</th>
              <th>Orders</th>
              <th>Revenue</th>
              <th>Pending Settlement</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map((r: any) => (
              <tr key={r.id} onClick={() => (window.location.href = `/admin/restaurants/${r.id}`)}>
                <td>
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-xs opacity-60">{r.cuisines?.join(", ")}</div>
                </td>
                <td>
                  <span className={`qb-admin-badge ${STATUS_STYLE[r.status] ?? ""}`}>{r.status}</span>
                </td>
                <td>{r.availabilityStatus === "OPEN" ? "Open" : "Closed"}</td>
                <td>★ {Number(r.rating).toFixed(1)}</td>
                <td>{r.totalOrders}</td>
                <td>₹{Number(r.totalRevenue).toFixed(0)}</td>
                <td>₹{Number(r.pendingSettlement).toFixed(0)}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1.5">
                    <Link href={`/admin/restaurants/${r.id}`} className="qb-admin-badge qb-admin-badge-primary">
                      View
                    </Link>
                    {r.status === "PENDING_APPROVAL" && (
                      <button onClick={(e) => approve(r.id, e)} className="qb-admin-badge qb-admin-badge-success">
                        Approve
                      </button>
                    )}
                    {r.status !== "SUSPENDED" && (
                      <button onClick={(e) => suspend(r.id, e)} className="qb-admin-badge qb-admin-badge-error">
                        Suspend
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && restaurants.length === 0 && <p className="opacity-60 text-sm p-4">No restaurants yet.</p>}
      </div>
    </div>
  );
}
