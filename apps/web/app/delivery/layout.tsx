"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PortalChrome } from "@/components/portal-chrome";
import { DriverNavDrawer } from "@/components/delivery/driver-nav-drawer";
import { api } from "@/lib/api";
import { connectDeliverySocket } from "@/lib/socket";

// Short generated tone via the Web Audio API — same technique already used by
// the restaurant kitchen page's "new order" chime (apps/web/app/restaurant/
// kitchen/page.tsx). No external/copyrighted audio file involved.
function playOfferTone(ctx: AudioContext) {
  const now = ctx.currentTime;
  [880, 1175].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + i * 0.14);
    gain.gain.exponentialRampToValueAtTime(0.25, now + i * 0.14 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.14 + 0.16);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + i * 0.14);
    osc.stop(now + i * 0.14 + 0.18);
  });
}

function OfferPopup() {
  const router = useRouter();
  const [offer, setOffer] = useState<any>(null);
  const [secondsLeft, setSecondsLeft] = useState(45);
  const [responding, setResponding] = useState(false);
  const [closedNotice, setClosedNotice] = useState<string | null>(null);
  const [needsSoundUnlock, setNeedsSoundUnlock] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  function getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;
    if (!audioCtxRef.current) audioCtxRef.current = new Ctor();
    return audioCtxRef.current;
  }

  function tryPlayOfferSound() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === "suspended") {
        // Browser autoplay policy blocked it — this is expected on a fresh
        // page load with no prior user gesture, not an error. Offer a clear
        // one-click way to unlock it instead of failing silently or throwing.
        setNeedsSoundUnlock(true);
        return;
      }
      playOfferTone(ctx);
    } catch {
      // Never let a sound failure break the actual offer flow.
    }
  }

  function enableSound() {
    const ctx = getAudioContext();
    ctx?.resume().then(() => {
      setNeedsSoundUnlock(false);
      playOfferTone(ctx);
    });
  }

  useEffect(() => {
    // One socket connection, one set of listeners, torn down on unmount —
    // registered once (empty dependency array), not on every render.
    const socket = connectDeliverySocket();
    socket?.on("delivery.offer", (payload: any) => {
      setOffer(payload);
      setClosedNotice(null);
      tryPlayOfferSound();
      const expiresAt = payload.offerExpiresAt ? new Date(payload.offerExpiresAt).getTime() : Date.now() + 45000;
      setSecondsLeft(Math.max(0, Math.round((expiresAt - Date.now()) / 1000)));
    });
    // Another driver won the accept race — this offer is no longer available.
    socket?.on("delivery.offerClosed", (payload: any) => {
      setOffer((current: any) => {
        if (!current || current.id !== payload.deliveryId) return current;
        setClosedNotice("This order was accepted by another driver.");
        return null;
      });
    });
    return () => {
      socket?.disconnect();
      audioCtxRef.current?.close().catch(() => {});
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

  useEffect(() => {
    if (!closedNotice) return;
    const t = setTimeout(() => setClosedNotice(null), 4000);
    return () => clearTimeout(t);
  }, [closedNotice]);

  async function respond(accept: boolean) {
    if (!offer || responding) return; // in-flight guard — prevents a double-click firing two requests
    setResponding(true);
    try {
      await api.delivery.respondToOffer(offer.id, accept);
      setOffer(null); // stops the sound state too — nothing left to ring for
      if (accept) router.push("/delivery/active");
    } catch (err: any) {
      // Most likely a 409 — another driver claimed it a moment before us.
      setOffer(null);
      setClosedNotice(
        err?.status === 409
          ? "This order was accepted by another driver."
          : "Could not respond to this offer. It may no longer be available.",
      );
    } finally {
      setResponding(false);
    }
  }

  if (!offer) {
    if (needsSoundUnlock) {
      return (
        <button
          onClick={enableSound}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 d3-card px-4 py-2 text-sm flex items-center gap-2"
        >
          🔔 Enable offer notification sound
        </button>
      );
    }
    if (!closedNotice) return null;
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 d3-card px-4 py-2 text-sm">
        {closedNotice}
      </div>
    );
  }

  const payout = offer.basePay + offer.distancePay + offer.surgeBonus + offer.tip;
  const shortOrderId = offer.orderId ? offer.orderId.slice(0, 8) : "------";

  return (
    <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4">
      <div className="qb-offer-card p-6 w-full max-w-sm" style={{ color: "var(--qb-text)" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-1.5">🚀 New Delivery</h3>
          <span
            className="text-xl font-bold tabular-nums"
            style={{ color: secondsLeft <= 10 ? "var(--qb-error)" : "var(--qb-primary)" }}
          >
            {secondsLeft}s
          </span>
        </div>
        <div className="text-sm space-y-2.5 mb-5">
          <div>
            <div className="opacity-60 text-xs">Restaurant</div>
            <div className="font-semibold text-base">{offer.restaurantName}</div>
          </div>
          <div>
            <div className="opacity-60 text-xs">Order</div>
            <div className="font-medium">#{shortOrderId}</div>
          </div>
          {offer.items?.length > 0 && (
            <div>
              <div className="opacity-60 text-xs">Items</div>
              {offer.items.map((i: any, idx: number) => (
                <div key={idx} className="opacity-90">
                  {i.name} × {i.quantity}
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="opacity-60 text-xs">Order Total</div>
              <div className="font-medium">₹{Number(offer.orderTotal ?? 0).toFixed(0)}</div>
            </div>
            <div className="text-right">
              <div className="opacity-60 text-xs">Distance</div>
              <div className="font-medium">{offer.distanceKm} km</div>
            </div>
          </div>
          <div>
            <div className="opacity-60 text-xs">Pickup</div>
            <div>{offer.restaurantName}</div>
          </div>
          <div className="opacity-70 text-xs pt-1 border-t" style={{ borderColor: "rgba(100, 28, 50, 0.16)" }}>
            Estimated payout: ₹{payout.toFixed(0)} · ~{Math.round(offer.distanceKm * 4)} mins
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => respond(false)}
            disabled={responding}
            className="d3-btn flex-1 py-2.5 rounded-xl qb-offer-decline-btn text-sm disabled:opacity-50"
          >
            {responding ? "..." : "Decline"}
          </button>
          <button
            onClick={() => respond(true)}
            disabled={responding}
            className="d3-btn flex-1 qb-btn-cta py-2.5 rounded-xl text-sm disabled:opacity-50"
          >
            {responding ? "Accepting..." : "Accept Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DeliveryLayout({ children }: { children: ReactNode }) {
  return (
    <PortalChrome portal="delivery" title="🛵 Quickbits Fleet" hideSidebar extraHeader={<DriverNavDrawer />}>
      <OfferPopup />
      {children}
    </PortalChrome>
  );
}
