"use client";

import { useState } from "react";

const FLEET_HOTLINE = "18001234567";

export default function SafetyPage() {
  const [confirmingSos, setConfirmingSos] = useState(false);
  const [sosNotice, setSosNotice] = useState<string | null>(null);
  const [ticketText, setTicketText] = useState("");
  const [ticketNotice, setTicketNotice] = useState<string | null>(null);

  // No real emergency-dispatch API exists in this backend (no
  // safety/sos.entity, no controller route) — a button that claimed to have
  // "notified the safety fleet" here would be a fake emergency call. Instead,
  // confirming SOS surfaces the one thing that's actually real right now:
  // the fleet hotline and emergency service numbers, all of which are real
  // tel: links below regardless of this flow.
  function confirmSos() {
    setConfirmingSos(false);
    setSosNotice(
      "SOS dispatch isn't connected to a live emergency system yet. Use the numbers below to get help immediately — Police, Ambulance, or the Quickbits Fleet hotline.",
    );
  }

  function submitTicket(e: React.FormEvent) {
    e.preventDefault();
    // No support-ticket backend exists either — same principle: don't claim
    // a submission succeeded when nothing was actually sent anywhere.
    setTicketNotice(
      "Issue reporting isn't connected to a live ticketing system yet. For urgent issues, please call the fleet hotline below.",
    );
    setTicketText("");
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold">Safety &amp; SOS</h1>
        <p className="text-sm opacity-60">24×7 support and emergency contacts for delivery partners.</p>
      </div>

      {!confirmingSos ? (
        <button
          onClick={() => setConfirmingSos(true)}
          className="w-full py-4 rounded-2xl text-white font-bold text-lg"
          style={{ background: "#e74040", minHeight: 44 }}
        >
          🆘 SOS Emergency
        </button>
      ) : (
        <div className="glass-card p-4 space-y-3" style={{ borderColor: "#e74040" }}>
          <p className="text-sm font-semibold">Are you sure you want to trigger SOS?</p>
          <p className="text-xs opacity-70">
            This is a safety feature for genuine emergencies only. If you're in immediate danger,
            call Police (112) or Ambulance (108) directly instead of waiting.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmingSos(false)}
              className="flex-1 py-2.5 rounded-xl text-sm glass-card"
              style={{ minHeight: 44 }}
            >
              Cancel
            </button>
            <button
              onClick={confirmSos}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: "#e74040", minHeight: 44 }}
            >
              Yes, Trigger SOS
            </button>
          </div>
        </div>
      )}

      {sosNotice && (
        <div className="glass-card p-4 text-sm" role="status" style={{ color: "var(--qb-warning)" }}>
          {sosNotice}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <a href="tel:112" className="glass-card p-3" style={{ minHeight: 44 }}>
          📞 Police<br />
          <b>112</b>
        </a>
        <a href="tel:108" className="glass-card p-3" style={{ minHeight: 44 }}>
          🚑 Ambulance<br />
          <b>108</b>
        </a>
        <a href={`tel:${FLEET_HOTLINE}`} className="glass-card p-3" style={{ minHeight: 44 }}>
          🛵 Fleet Support<br />
          <b>24×7</b>
        </a>
      </div>

      <div className="glass-card p-4 text-sm space-y-2">
        <h2 className="font-semibold">Safety Guidelines</h2>
        <ul className="list-disc pl-4 space-y-1 opacity-80 text-xs">
          <li>Wear your helmet and reflective gear on every trip.</li>
          <li>Never share your Pickup or Drop OTP with anyone except at the actual checkpoint.</li>
          <li>Pull over safely before responding to an order or checking the app.</li>
          <li>If a delivery location feels unsafe, contact fleet support before proceeding.</li>
        </ul>
      </div>

      <div className="glass-card p-4 space-y-2">
        <h2 className="font-semibold text-sm">Report an Issue</h2>
        <form onSubmit={submitTicket} className="space-y-2">
          <textarea
            value={ticketText}
            onChange={(e) => setTicketText(e.target.value)}
            placeholder="Describe your issue..."
            rows={3}
            className="w-full glass-card p-2 text-sm"
            required
          />
          <button type="submit" className="portal-btn-primary px-4 py-2 text-sm rounded-lg" style={{ minHeight: 44 }}>
            Submit
          </button>
        </form>
        {ticketNotice && (
          <p className="text-xs" style={{ color: "var(--qb-warning)" }} role="status">
            {ticketNotice}
          </p>
        )}
      </div>
    </div>
  );
}
