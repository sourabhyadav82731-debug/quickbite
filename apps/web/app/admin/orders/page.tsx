"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { connectOrdersSocket } from "@/lib/socket";

const STATUSES = [
  "ALL",
  "PAYMENT_PENDING",
  "PLACED",
  "ACCEPTED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "ASSIGNED",
  "PICKED_UP",
  "ON_THE_WAY",
  "DELIVERED",
  "CANCELLED",
];

const STATUS_BADGE: Record<string, string> = {
  DELIVERED: "qb-admin-badge-success",
  CANCELLED: "qb-admin-badge-error",
  PAYMENT_PENDING: "qb-admin-badge-warning",
  PLACED: "qb-admin-badge-info",
  ACCEPTED: "qb-admin-badge-info",
  PREPARING: "qb-admin-badge-info",
  READY_FOR_PICKUP: "qb-admin-badge-info",
  ASSIGNED: "qb-admin-badge-primary",
  PICKED_UP: "qb-admin-badge-primary",
  ON_THE_WAY: "qb-admin-badge-primary",
};

export default function AdminOrdersPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => setPage(1), [status, debouncedSearch, sortBy]);

  const query = new URLSearchParams({
    status,
    sortBy,
    page: String(page),
    pageSize: String(pageSize),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  }).toString();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", status, debouncedSearch, sortBy, page],
    queryFn: () => api.admin.orders(`?${query}`),
  });

  useEffect(() => {
    const socket = connectOrdersSocket();
    socket?.emit("admin.subscribeLedger", {});
    const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-orders"] });
    socket?.on("order.created", invalidate);
    socket?.on("order.statusChanged", invalidate);
    return () => {
      socket?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = (data as any)?.rows ?? [];
  const total = (data as any)?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold">All Orders</h1>
        <span className="text-xs opacity-60">{total} order{total === 1 ? "" : "s"}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="glass-card px-3 py-2 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "ALL" ? "All Statuses" : s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Order ID / Customer / Restaurant / Driver"
          className="glass-card px-3 py-2 text-sm flex-1 min-w-[220px]"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="glass-card px-3 py-2 text-sm"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest">Highest Value</option>
          <option value="lowest">Lowest Value</option>
        </select>
      </div>

      <div className="qb-admin-table-wrap">
        <table className="qb-admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Restaurant</th>
              <th>Driver</th>
              <th>Status</th>
              <th>Value</th>
              <th>Placed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o: any) => (
              <tr key={o.id} onClick={() => (window.location.href = `/admin/orders/${o.id}`)}>
                <td className="font-mono text-xs">#{o.id.slice(0, 8)}</td>
                <td>{o.customerName ?? "—"}</td>
                <td>{o.restaurantName ?? "—"}</td>
                <td>{o.driverName ?? "—"}</td>
                <td>
                  <span className={`qb-admin-badge ${STATUS_BADGE[o.status] ?? ""}`}>
                    {String(o.status).replace(/_/g, " ")}
                  </span>
                </td>
                <td className="font-semibold">₹{Number(o.grandTotal).toFixed(0)}</td>
                <td className="text-xs opacity-70">{new Date(o.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && rows.length === 0 && (
          <p className="opacity-60 text-sm p-4">No orders match these filters.</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="portal-btn-primary px-3 py-1.5 disabled:opacity-40"
          >
            Prev
          </button>
          <span className="opacity-70">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="portal-btn-primary px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
