"use client";

export default function RiskPage() {
  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-bold">Risk, Fraud & Anomaly Detection</h1>
      <div className="glass-card p-10 text-center opacity-60 text-sm">
        No anomalies detected. Real fraud/ML detection (fake GPS, suspicious cancellations,
        repeated refund claims) is planned for a future pass — the Audit Log below is the source
        of truth in this build.
      </div>
    </div>
  );
}
