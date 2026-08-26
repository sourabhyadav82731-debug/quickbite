"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PortalChrome } from "@/components/portal-chrome";
import { api, apiClient } from "@/lib/api";
import { connectDeliverySocket } from "@/lib/socket";

const NAV = [
  { href: "/delivery", label: "Dashboard" },
  { href: "/delivery/active", label: "Active" },
  { href: "/delivery/history", label: "History" },
  { href: "/delivery/map", label: "Heatmap" },
  { href: "/delivery/earnings", label: "Earnings" },
  { href: "/delivery/incentives", label: "Incentives" },
  { href: "/delivery/payouts", label: "Payouts" },
  { href: "/delivery/profile", label: "Profile" },
  { href: "/delivery/safety", label: "Safety" },
  { href: "/delivery/assistant", label: "AI Copilot" },
  { href: "/delivery/support", label: "Support" },
];

function DutyToggle() {
  const { data: profile } = useQuery({ queryKey: ["driver-me"], queryFn: () => apiClient.get<any>("/drivers/me") });
  const qc = useQueryClient();

  async function toggle() {
    if (!profile) return;
    await api.delivery.goOnline(!(profile as any).isOnline);
    qc.invalidateQueries({ queryKey: ["driver-me"] });
  }

  const isOnline = (profile as any)?.isOnline;
  return (
    <button
      onClick={toggle}
      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
      style={{ background: isOnline ? "#00B894" : "#95a5a6" }}
    >
      {isOnline ? "🟢 Online" : "⚪ Offline"}
    </button>
  );
}

function OfferPopup() {
  const router = useRouter();
  const [offer, setOffer] = useState<any>(null);
  const [secondsLeft, setSecondsLeft] = useState(45);

  useEffect(() => {
    const socket = connectDeliverySocket();
    socket?.on("delivery.offer", (payload: any) => {
      setOffer(payload);
      const expiresAt = payload.offerExpiresAt ? new Date(payload.offerExpiresAt).getTime() : Date.now() + 45000;
      setSecondsLeft(Math.max(0, Math.round((expiresAt - Date.now()) / 1000)));
    });
    return () => {
      socket?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!offer) return;
    if (secondsLeft <= 0) {
      setOffer(null);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [offer, secondsLeft]);

  async function respond(accept: boolean) {
    if (!offer) return;
    await api.delivery.respondToOffer(offer.id, accept);
    const wasAccepted = accept;
    setOffer(null);
    if (wasAccepted) router.push("/delivery/active");
  }

  if (!offer) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-card p-6 w-full max-w-sm" style={{ background: "var(--portal-bg)" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg">New Delivery Request</h3>
          <span className="text-xl font-bold" style={{ color: "var(--portal-primary)" }}>
            {secondsLeft}s
          </span>
        </div>
        <div className="text-sm space-y-1 mb-4 opacity-80">
          <div>Distance: {offer.distanceKm} km</div>
          <div>
            Estimated payout: ₹{(offer.basePay + offer.distancePay + offer.surgeBonus + offer.tip).toFixed(0)}
          </div>
          <div>Est. duration: ~{Math.round(offer.distanceKm * 4)} mins</div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => respond(false)} className="flex-1 py-2 rounded-lg glass-card text-sm">
            Decline
          </button>
          <button onClick={() => respond(true)} className="flex-1 portal-btn-primary py-2 text-sm">
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DeliveryLayout({ children }: { children: ReactNode }) {
  return (
    <PortalChrome portal="delivery" title="🛵 QuickBite Fleet" navLinks={NAV} extraHeader={<DutyToggle />}>
      <OfferPopup />
      {children}
    </PortalChrome>
  );
}
