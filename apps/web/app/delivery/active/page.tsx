"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { DeliveryStage, SupportedLanguage } from "@quickbite/types";
import { api, apiClient, friendlyErrorMessage } from "@/lib/api";
import { useWatchGeolocation } from "@/lib/geolocation";
import { useAssistantLanguage } from "@/lib/use-assistant-language";
import { t } from "@/lib/i18n/ui-strings";
import { DeliveryMap } from "@/components/delivery-map";

const STAGE_FLOW: { stage: DeliveryStage; label: string; needsOtp?: "pickup" | "drop" }[] = [
  { stage: DeliveryStage.ASSIGNED, label: "Navigate to Restaurant" },
  { stage: DeliveryStage.ARRIVED_AT_RESTAURANT, label: "Arrived at Restaurant" },
  { stage: DeliveryStage.PICKED_UP, label: "Pickup OTP → Picked Up", needsOtp: "pickup" },
  { stage: DeliveryStage.OUT_FOR_DELIVERY, label: "Out for Delivery" },
  { stage: DeliveryStage.ARRIVED_AT_CUSTOMER, label: "Arrived at Customer" },
  { stage: DeliveryStage.DELIVERED, label: "Drop OTP → Delivered", needsOtp: "drop" },
];

export default function ActiveDeliveryPage() {
  const qc = useQueryClient();
  const { data: activeList } = useQuery({
    queryKey: ["driver-active"],
    queryFn: () => apiClient.get<any[]>("/deliveries/active"),
    refetchInterval: 5000,
  });
  // listActiveForDriver now orders by createdAt DESC server-side, so "most
  // recent" is deterministic even in the (should-be-rare, now actively
  // prevented for new offers) case of more than one active delivery.
  const delivery = ((activeList as any[]) ?? [])[0];
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [justVerified, setJustVerified] = useState(false);
  const [codCollected, setCodCollected] = useState(false);
  const { language } = useAssistantLanguage();
  // Explicit opt-in toggle, same as before — GPS never starts on its own.
  // Below that, the actual watch is additionally gated on the delivery being
  // OUT_FOR_DELIVERY (an "active delivery") and the driver being online, so
  // toggling this ON earlier and then going offline, or the delivery moving
  // past OUT_FOR_DELIVERY, stops the watch even without the driver touching
  // the toggle again.
  const [sharingEnabled, setSharingEnabled] = useState(false);
  const { data: profile } = useQuery({
    queryKey: ["driver-me"],
    queryFn: () => apiClient.get<any>("/drivers/me"),
    refetchInterval: 10000,
  });
  const isOnline = (profile as any)?.isOnline ?? false;

  const watch = useWatchGeolocation((coords) => {
    if (!delivery) return;
    api.delivery.updateLocation(delivery.id, coords).catch(() => {});
  });

  const shouldTrack =
    sharingEnabled && isOnline && !!delivery && delivery.stage === DeliveryStage.OUT_FOR_DELIVERY;

  useEffect(() => {
    if (shouldTrack) {
      watch.start();
    } else {
      watch.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldTrack]);

  // Belt-and-braces: a watch left running past unmount (e.g. navigating away
  // mid-delivery) would keep burning battery/GPS for no UI anyone can see.
  useEffect(() => () => watch.stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  function openNavigation() {
    const destination =
      delivery.stage === DeliveryStage.OUT_FOR_DELIVERY || delivery.stage === DeliveryStage.ARRIVED_AT_CUSTOMER
        ? { lat: delivery.dropLat, lng: delivery.dropLng }
        : { lat: delivery.restaurantLat, lng: delivery.restaurantLng };
    if (destination.lat == null || destination.lng == null) return;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  if (!delivery) {
    return (
      <div className="d3-card p-10 text-center opacity-60">
        No active delivery. Accept an incoming request to get started.
      </div>
    );
  }

  const currentIdx = STAGE_FLOW.findIndex((s) => s.stage === delivery.stage);
  const next = STAGE_FLOW[currentIdx + 1];
  const shortOrderId = delivery.orderId ? delivery.orderId.slice(0, 8) : "------";

  async function advance() {
    if (submitting || !next) return; // prevent double-submit while a request is already in flight
    setError(null);
    setJustVerified(false);
    setSubmitting(true);
    try {
      await api.delivery.advanceStage(delivery.id, {
        stage: next.stage,
        // Trimmed, kept as a string throughout — never coerced to a number,
        // which would silently drop a leading zero (e.g. "0123" -> 123).
        otp: next.needsOtp ? otp.trim() : undefined,
      });
      if (next.needsOtp === "pickup") {
        setJustVerified(true);
        setTimeout(() => setJustVerified(false), 3000);
      }
      setOtp("");
      qc.invalidateQueries({ queryKey: ["driver-active"] });
      if (next.stage === DeliveryStage.DELIVERED) {
        // Trips/wallet/dashboard all read from these same query keys — refetch
        // them now instead of hand-incrementing any counter in local state, so
        // a browser refresh always shows the same (backend-computed) numbers.
        qc.invalidateQueries({ queryKey: ["driver-history"] });
        qc.invalidateQueries({ queryKey: ["driver-earnings"] });
        qc.invalidateQueries({ queryKey: ["driver-me"] });
      }
    } catch (err: any) {
      // Deliberately does NOT clear the otp input on failure — a wrong guess
      // shouldn't force the driver to re-type a valid OTP they mistyped once.
      setError(friendlyErrorMessage(err, "Failed to advance. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-5">
      <h1 className="text-xl font-bold">Active Delivery</h1>

      <div className="d3-card p-4 space-y-1 text-sm">
        <div className="font-semibold text-base">
          🏪 {delivery.restaurantName ?? "Restaurant"}
        </div>
        <div className="opacity-70">📦 Order #{shortOrderId}</div>
        {delivery.items?.length > 0 && (
          <div className="opacity-70 text-xs">
            {delivery.items.map((i: any, idx: number) => (
              <div key={idx}>
                {i.name} × {i.quantity}
              </div>
            ))}
          </div>
        )}
        {delivery.orderTotal != null && (
          <div className="opacity-70 text-xs">Order total: ₹{Number(delivery.orderTotal).toFixed(0)}</div>
        )}
      </div>

      <div className="d3-card p-4 flex items-center justify-between gap-3 text-sm">
        <div>
          <div className="font-medium">📍 {t("enableLocationSharing", language)}</div>
          <GpsStatusLine sharingEnabled={sharingEnabled} isOnline={isOnline} status={watch.status} language={language} />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={openNavigation}
            className="d3-btn glass-card px-3 py-1.5 rounded-lg text-xs"
          >
            {t("navigate", language)}
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={sharingEnabled}
            onClick={() => setSharingEnabled((v) => !v)}
            className="d3-btn portal-btn-primary px-3 py-1.5 rounded-lg text-xs"
            style={{ opacity: sharingEnabled ? 1 : 0.6 }}
          >
            {sharingEnabled ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {delivery.stage === DeliveryStage.OUT_FOR_DELIVERY && (
        <div className="space-y-1">
          <div className="text-xs font-semibold opacity-70">LIVE LOCATION</div>
          <DeliveryMap
            height={220}
            restaurant={
              delivery.restaurantLat != null ? { lat: delivery.restaurantLat, lng: delivery.restaurantLng } : null
            }
            destination={delivery.dropLat != null ? { lat: delivery.dropLat, lng: delivery.dropLng } : null}
            driver={watch.coords}
          />
        </div>
      )}

      <div className="d3-card p-4 space-y-1 text-sm">
        {STAGE_FLOW.map((s, i) => (
          <div key={s.stage} className="flex items-center gap-2">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white"
              style={{ background: i <= currentIdx ? "var(--portal-primary)" : "var(--portal-border)" }}
            >
              {i <= currentIdx ? "✓" : i + 1}
            </span>
            <span className={i <= currentIdx ? "font-medium" : "opacity-50"}>{s.label}</span>
          </div>
        ))}
      </div>

      {delivery.stage === DeliveryStage.ARRIVED_AT_CUSTOMER && (
        <label className="flex items-center gap-2 text-sm d3-card p-3">
          <input type="checkbox" checked={codCollected} onChange={(e) => setCodCollected(e.target.checked)} />
          Cash on Delivery collected
        </label>
      )}

      {justVerified && (
        <p className="text-sm font-medium text-center" style={{ color: "var(--portal-primary)" }}>
          ✓ Pickup verified
        </p>
      )}

      {next?.needsOtp && (
        <div className="space-y-1">
          <p className="text-xs opacity-60">
            {next.needsOtp === "pickup"
              ? "This OTP is provided by the restaurant — order #" + shortOrderId + "."
              : "This OTP is provided by the customer."}
          </p>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder={`Enter ${next.needsOtp} OTP`}
            maxLength={4}
            disabled={submitting}
            className="w-full d3-card px-3 py-3 text-center text-lg tracking-widest disabled:opacity-50"
          />
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {next && (
        <button
          onClick={advance}
          disabled={submitting}
          className="d3-btn portal-btn-primary w-full py-3 rounded-xl text-sm disabled:opacity-50"
        >
          {submitting
            ? next.needsOtp
              ? `Verifying ${next.needsOtp} OTP...`
              : "Updating..."
            : next.needsOtp
              ? `Verify ${next.needsOtp === "pickup" ? "Pickup" : "Delivery"} OTP`
              : next.label}
        </button>
      )}

      {!next && <p className="text-center opacity-60 text-sm">Delivery complete 🎉</p>}

      <button
        onClick={() => alert("Reported: Restaurant closed / Item spilled / Customer unreachable / Vehicle issue (simulated)")}
        className="w-full py-2 text-xs opacity-60 underline"
      >
        Report a problem
      </button>
    </div>
  );
}

function GpsStatusLine({
  sharingEnabled,
  isOnline,
  status,
  language,
}: {
  sharingEnabled: boolean;
  isOnline: boolean;
  status: string;
  language: SupportedLanguage;
}) {
  if (!sharingEnabled) {
    return <p className="text-xs opacity-60">Off — tap ON to share your live location on this trip.</p>;
  }
  if (!isOnline) {
    return <p className="text-xs opacity-60">Go online to start sharing your location.</p>;
  }
  if (status === "denied") {
    return (
      <p className="text-xs" style={{ color: "var(--qb-error)" }}>
        {t("permissionDenied", language)} — enable location access for this site in your browser
        settings, then reload.
      </p>
    );
  }
  if (status === "unavailable") {
    return (
      <p className="text-xs" style={{ color: "var(--qb-error)" }}>
        Location temporarily unavailable — retrying automatically.
      </p>
    );
  }
  if (status === "timeout") {
    return <p className="text-xs" style={{ color: "var(--qb-warning)" }}>GPS signal weak — retrying…</p>;
  }
  if (status === "granted") {
    return (
      <p className="text-xs" style={{ color: "var(--qb-success)" }}>
        🟢 Connected — {t("locationSharingOn", language)}
      </p>
    );
  }
  return <p className="text-xs opacity-60">Connecting to GPS…</p>;
}
