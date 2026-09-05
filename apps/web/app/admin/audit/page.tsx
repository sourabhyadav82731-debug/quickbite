"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function AuditLogPage() {
  const { data, isLoading } = useQuery({ queryKey: ["audit-log"], queryFn: () => api.admin.auditLog() });
  const logs = (data as any[]) ?? [];

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Admin Activity Log</h1>
      <p className="text-xs opacity-60">
        Every recorded admin action — order status changes, restaurant/driver/customer suspensions,
        refund decisions, coupon changes — with no sensitive information exposed.
      </p>
      <div className="qb-admin-table-wrap">
        <table className="qb-admin-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Entity</th>
              <th>Entity ID</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log: any) => (
              <tr key={log.id} style={{ cursor: "default" }}>
                <td className="font-semibold">{log.action}</td>
                <td>{log.entityType}</td>
                <td className="font-mono text-xs">{log.entityId?.slice(0, 8)}</td>
                <td className="text-xs opacity-70">{new Date(log.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && logs.length === 0 && <p className="opacity-60 text-sm p-4">No audit entries yet.</p>}
      </div>
    </div>
  );
}
