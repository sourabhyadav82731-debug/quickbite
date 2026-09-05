"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function AdminNotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-notifications"], queryFn: () => api.notifications.list() });
  const notifications = (data as any[]) ?? [];
  const unread = notifications.filter((n) => !n.isRead).length;

  async function markRead(id: string) {
    await api.notifications.markRead(id);
    qc.invalidateQueries({ queryKey: ["admin-notifications"] });
  }

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Notifications</h1>
        {!isLoading && <span className="qb-admin-badge qb-admin-badge-primary">{unread} unread</span>}
      </div>
      <div className="space-y-2">
        {notifications.map((n: any) => (
          <div
            key={n.id}
            onClick={() => !n.isRead && markRead(n.id)}
            className="qb-admin-kpi-card cursor-pointer"
            style={{ opacity: n.isRead ? 0.6 : 1 }}
          >
            <div className="flex justify-between items-start">
              <span className="font-semibold text-sm">{n.title}</span>
              {!n.isRead && <span className="qb-admin-badge qb-admin-badge-info">New</span>}
            </div>
            <p className="text-xs opacity-70 mt-1">{n.body}</p>
            <p className="text-[10px] opacity-50 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
          </div>
        ))}
        {!isLoading && notifications.length === 0 && (
          <p className="opacity-60 text-sm">No notifications yet.</p>
        )}
      </div>
    </div>
  );
}
