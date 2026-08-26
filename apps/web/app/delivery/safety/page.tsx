"use client";

export default function SafetyPage() {
  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold">24x7 Safety Center</h1>

      <button
        onClick={() => alert("SOS triggered (simulated) — QuickBite Safety Fleet has been notified.")}
        className="w-full py-4 rounded-2xl text-white font-bold text-lg"
        style={{ background: "#e74040" }}
      >
        🆘 SOS Emergency
      </button>

      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <a href="tel:112" className="glass-card p-3">📞 Police<br /><b>112</b></a>
        <a href="tel:108" className="glass-card p-3">🚑 Ambulance<br /><b>108</b></a>
        <a href="tel:18001234567" className="glass-card p-3">🛵 QuickBite Fleet<br /><b>24x7</b></a>
      </div>

      <div className="glass-card p-4 text-sm">
        <h2 className="font-semibold mb-1">Roadside Assistance</h2>
        <button
          onClick={() => alert("Roadside assistance requested (simulated).")}
          className="portal-btn-primary px-4 py-2 text-sm mt-1"
        >
          Request Assistance
        </button>
      </div>

      <div className="glass-card p-4 text-sm opacity-70">
        No active severe weather warnings for your zone.
      </div>
    </div>
  );
}
