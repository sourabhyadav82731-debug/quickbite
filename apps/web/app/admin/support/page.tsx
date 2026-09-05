"use client";

export default function AdminSupportPage() {
  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-bold">Support Center</h1>
      <div className="qb-admin-kpi-card p-8 text-center opacity-70 text-sm space-y-2">
        <p>
          No structured support-ticket system (Ticket/User/Category/Message/Status/Assigned Admin)
          exists in the backend yet — building it honestly requires a new ticket entity and
          submission flow from each portal, which is out of scope for this pass.
        </p>
        <p>
          The Quickbits Helping Agent (the AI assistant available in every portal) remains the live
          support channel today, unchanged by this work.
        </p>
      </div>
    </div>
  );
}
