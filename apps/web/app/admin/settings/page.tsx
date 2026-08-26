"use client";

export default function AdminSettingsPage() {
  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-bold">Platform Settings</h1>
      <div className="glass-card p-4 text-sm space-y-2">
        <div className="flex justify-between"><span>Environment</span><span className="opacity-60">Development (SQLite)</span></div>
        <div className="flex justify-between"><span>API Base URL</span><span className="opacity-60">{process.env.NEXT_PUBLIC_API_URL}</span></div>
        <div className="flex justify-between"><span>Realtime Gateways</span><span className="opacity-60">/ws/orders, /ws/delivery</span></div>
      </div>
      <p className="text-xs opacity-60">
        Broader platform configuration (payment gateway keys, SMS provider, feature flags) is
        planned for a future pass.
      </p>
    </div>
  );
}
