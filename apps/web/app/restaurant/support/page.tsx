"use client";

export default function RestaurantSupportPage() {
  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-bold">Merchant Help Desk</h1>
      <div className="glass-card p-4 text-sm">
        24x7 merchant priority hotline: <b>1800-QUICKBITE-BIZ</b> (simulated in this build)
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          alert("Dispute/ticket submitted (simulated) — the merchant success team will follow up.");
        }}
        className="glass-card p-4 space-y-2"
      >
        <h2 className="font-semibold text-sm">Raise a Dispute / Ticket</h2>
        <select className="w-full glass-card px-2 py-2 text-sm">
          <option>Customer cancellation dispute</option>
          <option>Refund dispute</option>
          <option>Payout discrepancy</option>
          <option>Other</option>
        </select>
        <textarea placeholder="Describe the issue..." rows={3} className="w-full glass-card p-2 text-sm" required />
        <button type="submit" className="portal-btn-primary px-4 py-2 text-sm">
          Submit
        </button>
      </form>
    </div>
  );
}
