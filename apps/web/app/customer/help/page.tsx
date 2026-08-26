"use client";

import { useState } from "react";

const FAQS = [
  { q: "How do I track my order?", a: "Open Orders → tap the active order to see the live tracking stepper and delivery partner details." },
  { q: "How do I cancel an order?", a: "You can cancel from the order tracking page while it's still Placed or Confirmed." },
  { q: "My order arrived incomplete, what do I do?", a: "Raise a ticket below with your order ID and our support team will follow up." },
  { q: "How do refunds work?", a: "Approved refunds are credited to your QuickBite Wallet within a few minutes in this build." },
];

export default function HelpPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold">Help & Support</h1>

      <div className="glass-card p-4 text-sm">
        24x7 support hotline: <b>1800-QUICKBITE</b> (simulated in this build)
      </div>

      <div className="space-y-2">
        {FAQS.map((f, i) => (
          <div key={f.q} className="glass-card p-4">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full text-left font-medium text-sm flex justify-between"
            >
              {f.q}
              <span>{open === i ? "−" : "+"}</span>
            </button>
            {open === i && <p className="text-sm opacity-70 mt-2">{f.a}</p>}
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          alert("Ticket submitted (simulated) — support will reach out shortly.");
        }}
        className="glass-card p-4 space-y-2"
      >
        <h2 className="font-semibold text-sm">Raise a Ticket</h2>
        <textarea placeholder="Describe your issue..." rows={3} className="w-full glass-card p-2 text-sm" required />
        <button type="submit" className="portal-btn-primary px-4 py-2 text-sm">
          Submit
        </button>
      </form>
    </div>
  );
}
