"use client";

export default function DeliverySupportPage() {
  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold">Partner Support</h1>
      <div className="glass-card p-4 text-sm">
        Live chat with dispatch is simulated in this build. Call the fleet hotline for urgent
        issues.
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          alert("Ticket submitted (simulated) — dispatch will follow up.");
        }}
        className="glass-card p-4 space-y-2"
      >
        <textarea placeholder="Describe your issue..." rows={3} className="w-full glass-card p-2 text-sm" required />
        <button type="submit" className="portal-btn-primary px-4 py-2 text-sm">
          Submit Ticket
        </button>
      </form>
    </div>
  );
}
