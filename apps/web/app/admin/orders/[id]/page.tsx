"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

function money(n: number | undefined) {
  return `₹${Number(n ?? 0).toFixed(2)}`;
}

const TIMELINE_LABEL: Record<string, string> = {
  PAYMENT_PENDING: "Payment Initiated",
  PLACED: "Order Placed",
  ACCEPTED: "Restaurant Accepted",
  PREPARING: "Preparing",
  READY_FOR_PICKUP: "Ready for Pickup",
  ASSIGNED: "Driver Assigned",
  PICKED_UP: "Picked Up",
  ON_THE_WAY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUND_REQUESTED: "Refund Requested",
  REFUND_APPROVED: "Refund Approved",
  REFUND_REJECTED: "Refund Rejected",
  REFUND_PROCESSING: "Refund Processing",
  REFUND_REFUNDED: "Refund Completed",
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const id = params?.id as string;
  const [refundReason, setRefundReason] = useState("");
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-order-detail", id],
    queryFn: () => api.admin.orderDetail(id),
    enabled: !!id,
  });
  const d = data as any;

  async function fileRefund() {
    if (!refundReason.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api.admin.createRefund(id, refundReason.trim());
      setShowRefundForm(false);
      setRefundReason("");
      qc.invalidateQueries({ queryKey: ["admin-order-detail", id] });
    } catch (err: any) {
      setError(err?.message ?? "Could not file refund request.");
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) return <p className="text-sm opacity-60">Loading order…</p>;
  if (!d) return <p className="text-sm opacity-60">Order not found.</p>;

  const { order, items, customer, restaurant, driver, delivery, payment, refunds, timeline, priceBreakdown } = d;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <button onClick={() => router.back()} className="text-xs opacity-60 mb-1">
            ← Back
          </button>
          <h1 className="text-xl font-bold font-mono">Order #{order.id.slice(0, 8)}</h1>
        </div>
        <span className="qb-admin-badge qb-admin-badge-primary text-sm px-3 py-1.5">
          {order.status.replace(/_/g, " ")}
        </span>
      </div>

      {/* ORDER SUMMARY */}
      <Section title="Order Summary">
        <Grid>
          <Field label="Placed At" value={new Date(order.createdAt).toLocaleString()} />
          <Field label="Payment Method" value={order.paymentMethod} />
          <Field label="Special Instructions" value={order.specialInstructions ?? "—"} />
          {order.cancelledReason && <Field label="Cancellation Reason" value={order.cancelledReason} />}
        </Grid>
      </Section>

      {/* CUSTOMER / RESTAURANT / DRIVER */}
      <div className="grid md:grid-cols-3 gap-4">
        <Section title="Customer">
          {customer ? (
            <Grid cols={1}>
              <Field label="Name" value={customer.name} />
              <Field label="Email" value={customer.email} />
              <Field label="Phone" value={customer.phone ?? "—"} />
            </Grid>
          ) : (
            <p className="text-xs opacity-60">Unavailable</p>
          )}
        </Section>
        <Section title="Restaurant">
          {restaurant ? (
            <Grid cols={1}>
              <Field label="Name" value={restaurant.name} />
              <Field label="Status" value={restaurant.status} />
              <Field label="Commission" value={`${(restaurant.commissionRate * 100).toFixed(1)}%`} />
            </Grid>
          ) : (
            <p className="text-xs opacity-60">Unavailable</p>
          )}
        </Section>
        <Section title="Driver">
          {driver ? (
            <Grid cols={1}>
              <Field label="Name" value={driver.name} />
              <Field label="Phone" value={driver.phone ?? "—"} />
              <Field label="Stage" value={delivery?.stage ?? "—"} />
            </Grid>
          ) : (
            <p className="text-xs opacity-60">Not yet assigned</p>
          )}
        </Section>
      </div>

      {/* ITEMS */}
      <Section title="Items">
        <div className="qb-admin-table-wrap">
          <table className="qb-admin-table">
            <thead>
              <tr>
                <th>Dish</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Restaurant Price</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it: any) => (
                <tr key={it.id} style={{ cursor: "default" }}>
                  <td>{it.nameSnapshot}</td>
                  <td>{it.quantity}</td>
                  <td>{money(it.unitPriceSnapshot)}</td>
                  <td>{money(it.restaurantPriceSnapshot)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* PRICE BREAKDOWN */}
      <Section title="Price Breakdown">
        <Grid>
          <Field label="Food Price (Item Total)" value={money(priceBreakdown.itemTotal)} />
          <Field label="Delivery Fee" value={money(priceBreakdown.deliveryFee)} />
          <Field label="Packaging Fee" value={money(priceBreakdown.packagingFee)} />
          <Field label="Platform Fee" value={money(priceBreakdown.platformFee)} />
          <Field label="Tax" value={money(priceBreakdown.taxAmount)} />
          <Field label="Discount / Coupon" value={`-${money(priceBreakdown.discountAmount)}`} />
          <Field label="Tip" value={money(priceBreakdown.tipAmount)} />
          <Field label="Customer Charged (Grand Total)" value={money(priceBreakdown.grandTotal)} highlight />
          <Field label="Platform Commission" value={money(priceBreakdown.platformCommission)} />
          <Field label="Restaurant Settlement" value={money(priceBreakdown.restaurantSettlement)} />
          <Field label="Driver Earning" value={money(priceBreakdown.driverEarning)} />
        </Grid>
      </Section>

      {/* PAYMENT */}
      <Section title="Payment">
        {payment ? (
          <Grid>
            <Field label="Method" value={payment.method} />
            <Field label="Status" value={payment.status} />
            <Field label="Amount" value={money(payment.amount)} />
            {payment.razorpayOrderId && <Field label="Razorpay Order ID" value={payment.razorpayOrderId} mono />}
            {payment.razorpayPaymentId && <Field label="Razorpay Payment ID" value={payment.razorpayPaymentId} mono />}
          </Grid>
        ) : (
          <p className="text-xs opacity-60">No payment record.</p>
        )}
      </Section>

      {/* DELIVERY */}
      {delivery && (
        <Section title="Delivery">
          <Grid>
            <Field label="Stage" value={delivery.stage} />
            <Field label="Base Pay" value={money(delivery.basePay)} />
            <Field label="Distance Pay" value={money(delivery.distancePay)} />
            <Field label="Surge Bonus" value={money(delivery.surgeBonus)} />
            <Field label="Tip" value={money(delivery.tip)} />
            <Field label="Distance" value={`${delivery.distanceKm} km`} />
          </Grid>
        </Section>
      )}

      {/* TRANSITION HISTORY — vertical timeline */}
      <Section title="Transition History">
        {timeline.length === 0 ? (
          <p className="text-xs opacity-60">
            No transition history recorded for this order — it was placed before the audit-trail
            mechanism was added, or is still awaiting its first tracked transition.
          </p>
        ) : (
          <div className="qb-admin-timeline">
            {timeline.map((ev: any, idx: number) => (
              <div key={idx} className="qb-admin-timeline-item">
                <div className="qb-admin-timeline-dot" />
                <div className="text-sm font-semibold">{TIMELINE_LABEL[ev.status] ?? ev.status}</div>
                <div className="text-xs opacity-60">
                  {new Date(ev.occurredAt).toLocaleString()} · by {ev.actorType}
                </div>
                {ev.note && <div className="text-xs opacity-70 mt-0.5">{ev.note}</div>}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* REFUND */}
      <Section title="Refund">
        {refunds.length > 0 ? (
          <div className="space-y-3">
            {refunds.map((r: any) => (
              <div key={r.id} className="glass-card p-3 text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{money(r.refundAmount)}</span>
                  <span className="qb-admin-badge qb-admin-badge-primary">{r.status}</span>
                </div>
                <div className="text-xs opacity-70">{r.reason}</div>
                {r.adminNote && <div className="text-xs opacity-70">Admin note: {r.adminNote}</div>}
              </div>
            ))}
          </div>
        ) : (
          <>
            <p className="text-xs opacity-60 mb-2">No refund has been filed for this order.</p>
            {(order.status === "DELIVERED" || order.status === "CANCELLED") && (
              <>
                {!showRefundForm ? (
                  <button onClick={() => setShowRefundForm(true)} className="portal-btn-primary px-3 py-1.5 text-xs">
                    File Refund
                  </button>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="Reason for refund"
                      className="w-full glass-card px-3 py-2 text-sm"
                      rows={2}
                    />
                    {error && <p className="text-xs" style={{ color: "var(--qb-error)" }}>{error}</p>}
                    <div className="flex gap-2">
                      <button onClick={fileRefund} disabled={busy} className="portal-btn-primary px-3 py-1.5 text-xs disabled:opacity-50">
                        {busy ? "Filing…" : "Submit Refund Request"}
                      </button>
                      <button onClick={() => setShowRefundForm(false)} className="glass-card px-3 py-1.5 text-xs">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="qb-admin-kpi-card">
      <h2 className="font-bold text-sm mb-3">{title.toUpperCase()}</h2>
      {children}
    </div>
  );
}

function Grid({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  const colsClass = cols === 1 ? "sm:grid-cols-1" : "sm:grid-cols-2";
  return <div className={`grid grid-cols-1 ${colsClass} gap-x-6 gap-y-2 text-sm`}>{children}</div>;
}

function Field({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string | number;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between sm:block">
      <span className="opacity-60 text-xs">{label}</span>
      <span
        className={`sm:block ${mono ? "font-mono text-xs" : ""} ${highlight ? "font-bold" : ""}`}
        style={highlight ? { color: "var(--qb-primary)" } : undefined}
      >
        {value}
      </span>
    </div>
  );
}
