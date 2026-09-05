"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { OrderStatus } from "@quickbite/types";
import { api, friendlyErrorMessage } from "@/lib/api";
import { useRestaurant } from "@/lib/restaurant-context";
import { useLiveOrders } from "@/lib/use-live-orders";

const COLUMNS: { key: string; label: string; statuses: OrderStatus[] }[] = [
  { key: "incoming", label: "Incoming Requests", statuses: [OrderStatus.PLACED] },
  { key: "preparing", label: "In Preparation", statuses: [OrderStatus.ACCEPTED, OrderStatus.PREPARING] },
  { key: "ready", label: "Ready for Pickup", statuses: [OrderStatus.READY_FOR_PICKUP] },
  {
    key: "done",
    label: "Completed / Dispatched",
    statuses: [OrderStatus.ASSIGNED, OrderStatus.PICKED_UP, OrderStatus.ON_THE_WAY, OrderStatus.DELIVERED],
  },
];

const COLUMN_ACCENT: Record<string, string> = {
  incoming: "#e17055",
  preparing: "#fdcb6e",
  ready: "#00b894",
  done: "#636e72",
};

// GET /orders?restaurantId=X (the live list this board polls/subscribes to)
// doesn't include line items — GET /orders/:id (existing, unchanged) does.
// Fetched once per order, cached indefinitely: an order's items never change
// after creation, so there's no reason to refetch them.
function useOrderItems(orderId: string) {
  const { data } = useQuery({
    queryKey: ["order-items", orderId],
    queryFn: () => api.orders.get(orderId),
    staleTime: Infinity,
  });
  return (data as any)?.items as
    | { nameSnapshot: string; quantity: number; restaurantPriceSnapshot: number }[]
    | undefined;
}

export default function KitchenPage() {
  const { active } = useRestaurant();
  // Tracks which orders currently have an in-flight status-update request, so a
  // fast double-click can't fire the same PATCH twice for one order — that's
  // exactly what was hitting the deliveries.orderId unique constraint and
  // crashing with a 500 on the second READY_FOR_PICKUP call. Shared with the
  // Dashboard's own live-orders panel via useLiveOrders, so both surfaces stay
  // in sync automatically instead of keeping two copies of this logic.
  const { orders, advance, advancingIds, error, setError } = useLiveOrders(active?.id);
  // orderId -> pickup OTP once generated. Not part of the order object itself
  // (it lives on the delivery record, restaurant/admin-only) — fetched on
  // demand via "Generate Pickup OTP", never polled or pushed over the socket.
  const [pickupOtps, setPickupOtps] = useState<Record<string, string | null>>({});
  const [otpLoadingIds, setOtpLoadingIds] = useState<Set<string>>(new Set());

  async function generateOtp(orderId: string) {
    if (otpLoadingIds.has(orderId)) return; // ignore a repeat click while the first request is still in flight
    setOtpLoadingIds((prev) => new Set(prev).add(orderId));
    setError(null);
    try {
      const res: any = await api.delivery.generatePickupOtp(orderId);
      setPickupOtps((prev) => ({ ...prev, [orderId]: res.pickupOtp }));
    } catch (err: any) {
      setError(friendlyErrorMessage(err, "Could not generate the pickup OTP. Please try again."));
    } finally {
      setOtpLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  }

  if (!active) return <p className="opacity-60">No restaurant found for this account.</p>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Kitchen</h1>
        <p className="text-sm opacity-60">Live order board — updates in realtime.</p>
      </div>

      {error && (
        <div className="d3-card p-3 text-sm text-red-500 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="opacity-60 text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colOrders = orders.filter((o) => col.statuses.includes(o.status));
          return (
            <div key={col.key} className="space-y-3">
              <div className="flex items-center gap-2 sticky top-16 z-10 py-1" style={{ background: "var(--portal-bg)" }}>
                <span className="w-2 h-2 rounded-full" style={{ background: COLUMN_ACCENT[col.key] }} />
                <h2 className="font-bold text-sm">{col.label}</h2>
                <span className="text-xs opacity-50">({colOrders.length})</span>
              </div>
              {colOrders.map((o) => (
                <OrderCard
                  key={o.id}
                  order={o}
                  restaurantName={active.name}
                  advancing={advancingIds.has(o.id)}
                  onAdvance={(status) => advance(o.id, status)}
                  pickupOtp={pickupOtps[o.id]}
                  otpLoading={otpLoadingIds.has(o.id)}
                  onGenerateOtp={() => generateOtp(o.id)}
                />
              ))}
              {colOrders.length === 0 && (
                <p className="text-xs opacity-40 text-center py-4">No orders here.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderCard({
  order: o,
  restaurantName,
  advancing,
  onAdvance,
  pickupOtp,
  otpLoading,
  onGenerateOtp,
}: {
  order: any;
  restaurantName: string;
  advancing: boolean;
  onAdvance: (status: OrderStatus) => void;
  pickupOtp: string | null | undefined;
  otpLoading: boolean;
  onGenerateOtp: () => void;
}) {
  const items = useOrderItems(o.id);

  return (
    <div className="d3-card d3-card-hover p-3.5 text-sm">
      <div className="flex justify-between items-center mb-1.5">
        <span className="font-semibold">#{o.id.slice(0, 8)}</span>
        <span className="text-xs opacity-60">{items?.length ?? "…"} items</span>
      </div>
      {items && items.length > 0 && (
        <div className="text-xs opacity-70 mb-1.5 space-y-0.5">
          {items.map((it, idx) => (
            <div key={idx}>
              {it.quantity} × {it.nameSnapshot}{" "}
              <span className="opacity-50">(₹{it.restaurantPriceSnapshot} ea)</span>
            </div>
          ))}
        </div>
      )}
      {o.specialInstructions && (
        <p className="text-xs italic opacity-60 mb-1">"{o.specialInstructions}"</p>
      )}
      <div className="flex items-center justify-between text-xs opacity-60 mb-2.5">
        <span>{o.paymentMethod}</span>
        <span className="font-semibold opacity-100">₹{o.grandTotal.toFixed(0)}</span>
      </div>

      {o.status === OrderStatus.PLACED && (
        <div className="flex gap-2">
          <button
            onClick={() => onAdvance(OrderStatus.ACCEPTED)}
            disabled={advancing}
            className="d3-btn qb-btn-cta px-2 py-1.5 rounded-lg text-xs flex-1 disabled:opacity-50"
          >
            {advancing ? "..." : "Accept"}
          </button>
          <button
            onClick={() => onAdvance(OrderStatus.CANCELLED)}
            disabled={advancing}
            className="d3-btn px-2 py-1.5 text-xs flex-1 rounded-lg text-red-500 d3-card disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      )}
      {o.status === OrderStatus.ACCEPTED && (
        <button
          onClick={() => onAdvance(OrderStatus.PREPARING)}
          disabled={advancing}
          className="d3-btn portal-btn-primary px-2 py-1.5 rounded-lg text-xs w-full disabled:opacity-50"
        >
          {advancing ? "Updating..." : "Start Preparing"}
        </button>
      )}
      {o.status === OrderStatus.PREPARING && (
        <button
          onClick={() => onAdvance(OrderStatus.READY_FOR_PICKUP)}
          disabled={advancing}
          className="d3-btn portal-btn-primary px-2 py-1.5 rounded-lg text-xs w-full disabled:opacity-50"
        >
          {advancing ? "Updating..." : "Food Ready"}
        </button>
      )}
      {(o.status === OrderStatus.READY_FOR_PICKUP || o.status === OrderStatus.ASSIGNED) &&
        (pickupOtp ? (
          <div className="space-y-1">
            <div className="text-center py-1.5 rounded-lg" style={{ background: "var(--portal-border)" }}>
              <div className="text-[10px] opacity-60">Pickup OTP</div>
              <div className="font-bold text-lg tracking-widest" style={{ color: "var(--portal-primary)" }}>
                {pickupOtp}
              </div>
              <div className="text-[10px] opacity-60 mt-1">
                Order: #{o.id.slice(0, 8)} · {restaurantName}
              </div>
            </div>
            <p className="text-xs opacity-60 text-center">
              {o.status === OrderStatus.ASSIGNED ? "Driver assigned · awaiting pickup" : "Waiting for pickup"}
            </p>
          </div>
        ) : (
          <button
            onClick={onGenerateOtp}
            disabled={otpLoading}
            className="d3-btn portal-btn-primary px-2 py-1.5 rounded-lg text-xs w-full disabled:opacity-50"
          >
            {otpLoading ? "Generating..." : "Generate Pickup OTP"}
          </button>
        ))}
      {[OrderStatus.PICKED_UP, OrderStatus.ON_THE_WAY, OrderStatus.DELIVERED].includes(o.status) && (
        <p className="text-xs font-medium" style={{ color: "var(--portal-primary)" }}>
          ✓ Picked up by driver
        </p>
      )}
    </div>
  );
}
