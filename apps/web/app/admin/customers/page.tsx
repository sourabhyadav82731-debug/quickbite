"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function AdminCustomersPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-customers"], queryFn: () => api.admin.customers() });
  const customers = (data as any[]) ?? [];

  async function toggle(id: string, isActive: boolean, e: React.MouseEvent) {
    e.stopPropagation();
    if (isActive && !confirm("Suspend this customer's account?")) return;
    await (isActive ? api.admin.suspendUser(id) : api.admin.activateUser(id));
    qc.invalidateQueries({ queryKey: ["admin-customers"] });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Customer Management</h1>
      <div className="qb-admin-table-wrap">
        <table className="qb-admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Orders</th>
              <th>Completed</th>
              <th>Cancelled</th>
              <th>Total Spent</th>
              <th>Refunds</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c: any) => (
              <tr key={c.id} onClick={() => (window.location.href = `/admin/customers/${c.id}`)}>
                <td className="font-semibold">{c.name}</td>
                <td className="text-xs">{c.email}<br /><span className="opacity-60">{c.phone}</span></td>
                <td>{c.totalOrders}</td>
                <td>{c.completedOrders}</td>
                <td>{c.cancelledOrders}</td>
                <td>₹{Number(c.totalSpent).toFixed(0)}</td>
                <td>₹{Number(c.totalRefunds).toFixed(0)}</td>
                <td>
                  <span className={`qb-admin-badge ${c.isActive ? "qb-admin-badge-success" : "qb-admin-badge-error"}`}>
                    {c.isActive ? "Active" : "Suspended"}
                  </span>
                </td>
                <td className="text-xs opacity-70">{new Date(c.createdAt).toLocaleDateString()}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => toggle(c.id, c.isActive, e)}
                    className={`qb-admin-badge ${c.isActive ? "qb-admin-badge-error" : "qb-admin-badge-success"}`}
                  >
                    {c.isActive ? "Suspend" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && customers.length === 0 && <p className="opacity-60 text-sm p-4">No customers yet.</p>}
      </div>
    </div>
  );
}
