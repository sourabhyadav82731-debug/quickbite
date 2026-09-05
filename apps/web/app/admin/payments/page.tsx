"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const STATUSES = ["ALL", "PENDING", "SUCCEEDED", "FAILED", "REFUNDED"];
const STATUS_BADGE: Record<string, string> = {
  SUCCEEDED: "qb-admin-badge-success",
  PENDING: "qb-admin-badge-warning",
  FAILED: "qb-admin-badge-error",
  REFUNDED: "qb-admin-badge-primary",
};

export default function PaymentsPage() {
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => setPage(1), [status, debounced]);

  const query = new URLSearchParams({
    status,
    page: String(page),
    pageSize: String(pageSize),
    ...(debounced ? { search: debounced } : {}),
  }).toString();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payments", status, debounced, page],
    queryFn: () => api.admin.payments(`?${query}`),
  });
  const rows = (data as any)?.rows ?? [];
  const total = (data as any)?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold">Payments &amp; Transactions</h1>
        <span className="text-xs opacity-60">{total} transaction{total === 1 ? "" : "s"}</span>
      </div>
      <p className="text-xs opacity-60">
        Razorpay order/payment reference IDs are shown for reconciliation — secret keys and API
        credentials are never exposed to the browser.
      </p>

      <div className="flex flex-wrap gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="glass-card px-3 py-2 text-sm">
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "ALL" ? "All Statuses" : s}
            </option>
          ))}
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Order ID / Customer"
          className="glass-card px-3 py-2 text-sm flex-1 min-w-[220px]"
        />
      </div>

      <div className="qb-admin-table-wrap">
        <table className="qb-admin-table">
          <thead>
            <tr>
              <th>Transaction</th>
              <th>Order</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p: any) => (
              <tr key={p.id} style={{ cursor: "default" }}>
                <td className="font-mono text-xs">{p.razorpayPaymentId ?? p.id.slice(0, 8)}</td>
                <td>
                  <Link href={`/admin/orders/${p.orderId}`} className="hover:underline">
                    #{p.orderId.slice(0, 8)}
                  </Link>
                </td>
                <td>{p.customerName ?? "—"}</td>
                <td className="font-semibold">₹{Number(p.amount).toFixed(2)}</td>
                <td>{p.method}</td>
                <td>
                  <span className={`qb-admin-badge ${STATUS_BADGE[p.status] ?? ""}`}>{p.status}</span>
                </td>
                <td className="text-xs opacity-70">{new Date(p.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && rows.length === 0 && <p className="opacity-60 text-sm p-4">No transactions found.</p>}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="portal-btn-primary px-3 py-1.5 disabled:opacity-40">
            Prev
          </button>
          <span className="opacity-70">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="portal-btn-primary px-3 py-1.5 disabled:opacity-40">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
