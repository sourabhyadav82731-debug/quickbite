"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function AuditLogPage() {
  const { data } = useQuery({ queryKey: ["audit-log"], queryFn: () => api.admin.auditLog() });

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Admin Audit Log</h1>
      <div className="glass-card divide-y" style={{ borderColor: "var(--portal-border)" }}>
        {((data as any[]) ?? []).map((log) => (
          <div key={log.id} className="p-3 text-sm flex justify-between">
            <span>
              {log.action} · {log.entityType} #{log.entityId.slice(0, 8)}
            </span>
            <span className="opacity-50 text-xs">{new Date(log.createdAt).toLocaleString()}</span>
          </div>
        ))}
        {((data as any[]) ?? []).length === 0 && <p className="p-4 opacity-60 text-sm">No audit entries yet.</p>}
      </div>
    </div>
  );
}
