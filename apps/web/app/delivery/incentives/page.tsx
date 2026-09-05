"use client";

// This page previously showed a "Milestone Incentives" progress UI driven by
// DAILY_INCENTIVE_TIERS — a static config constant (₹250 for 12 orders, ₹600
// for 20), not anything the backend actually tracks or pays out. No
// DriverIncentive entity/API exists anywhere in this codebase, so that was
// fabricated data wearing a real-looking progress bar. Replaced with an
// honest empty state until a real incentive system exists to connect here.
export default function IncentivesPage() {
  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold">Incentives &amp; Bonuses</h1>
        <p className="text-sm opacity-60">Milestone and surge bonuses from Quickbits.</p>
      </div>

      <div className="d3-card p-10 text-center space-y-2">
        <div className="text-3xl opacity-40">🎁</div>
        <p className="font-medium opacity-80">No active incentives right now.</p>
        <p className="text-xs opacity-50">
          When Quickbits runs a bonus campaign for your zone, it will appear here automatically.
        </p>
      </div>
    </div>
  );
}
