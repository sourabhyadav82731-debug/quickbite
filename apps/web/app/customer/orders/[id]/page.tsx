"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { OrderStatus } from "@quickbite/types";
import { api, apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { connectDeliverySocket, connectOrdersSocket } from "@/lib/socket";
import { openRazorpayCheckout } from "@/lib/razorpay";

const STEPS = [
  { label: "Order Placed", statuses: [OrderStatus.PLACED] },
  { label: "Confirmed by Restaurant", statuses: [OrderStatus.ACCEPTED] },
  { label: "Cooking in Kitchen", statuses: [OrderStatus.PREPARING] },
  {
    label: "Out for Delivery",
    statuses: [
      OrderStatus.READY_FOR_PICKUP,
      OrderStatus.ASSIGNED,
      OrderStatus.PICKED_UP,
      OrderStatus.ON_THE_WAY,
    ],
  },
  { label: "Delivered", statuses: [OrderStatus.DELIVERED] },
];

function currentStep(status: OrderStatus) {
  if (status === OrderStatus.CANCELLED) return -1;
  return STEPS.findIndex((s) => s.statuses.includes(status));
}

const CANCELLABLE_STATUSES: OrderStatus[] = [
  OrderStatus.PAYMENT_PENDING,
  OrderStatus.PLACED,
  OrderStatus.ACCEPTED,
];

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [order, setOrder] = useState<any>(null);
  const [delivery, setDelivery] = useState<any>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [paymentState, setPaymentState] = useState<"idle" | "processing" | "failed" | "cancelled">(
    "idle",
  );
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const { data } = useQuery({ queryKey: ["order", id], queryFn: () => api.orders.get(id) });
  const { data: deliveryData } = useQuery({
    queryKey: ["delivery-for-order", id],
    queryFn: () => apiClient.get(`/deliveries/order/${id}`),
    enabled: !!order && order.status !== OrderStatus.PAYMENT_PENDING,
  });
  const { data: paymentInfo } = useQuery({
    queryKey: ["payment-for-order", id],
    queryFn: () => api.payments.getForOrder(id) as Promise<any>,
    enabled: !!order && order.status === OrderStatus.PAYMENT_PENDING,
  });

  useEffect(() => setOrder(data), [data]);
  useEffect(() => setDelivery(deliveryData), [deliveryData]);

  useEffect(() => {
    if (order?.status !== OrderStatus.PAYMENT_PENDING) return;
    const ordersSocket = connectOrdersSocket();
    ordersSocket?.emit("order.subscribe", { orderId: id });
    ordersSocket?.on("order.statusChanged", (updated: any) => {
      if (updated.id === id) setOrder(updated);
    });
    return () => {
      ordersSocket?.disconnect();
    };
  }, [id, order?.status]);

  useEffect(() => {
    if (!order || order.status === OrderStatus.PAYMENT_PENDING) return;
    const ordersSocket = connectOrdersSocket();
    const deliverySocket = connectDeliverySocket();
    ordersSocket?.emit("order.subscribe", { orderId: id });
    deliverySocket?.emit("delivery.subscribe", { orderId: id });

    ordersSocket?.on("order.statusChanged", (updated: any) => {
      if (updated.id === id) setOrder(updated);
    });
    deliverySocket?.on("delivery.stageChanged", (updated: any) => {
      if (updated.orderId === id) setDelivery((prev: any) => ({ ...prev, ...updated }));
    });
    deliverySocket?.on("delivery.locationChanged", (loc: any) => {
      setLocation({ lat: loc.lat, lng: loc.lng });
    });

    return () => {
      ordersSocket?.disconnect();
      deliverySocket?.disconnect();
    };
  }, [id, order?.status]);

  async function cancelOrder() {
    await api.orders.cancel(id, "Customer requested cancellation");
    qc.invalidateQueries({ queryKey: ["order", id] });
  }

  async function handlePayNow() {
    if (!paymentInfo) return;
    setPaymentState("processing");
    setPaymentError(null);
    await openRazorpayCheckout({
      keyId: paymentInfo.keyId,
      amountPaise: paymentInfo.amountPaise,
      currency: paymentInfo.currency,
      razorpayOrderId: paymentInfo.razorpayOrderId,
      name: "QuickBite",
      description: `Order #${id.slice(0, 8)}`,
      prefill: { name: user?.name, email: user?.email },
      onSuccess: async (response) => {
        try {
          await api.payments.verify({
            orderId: id,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          setPaymentState("idle");
          qc.invalidateQueries({ queryKey: ["order", id] });
        } catch (err: any) {
          setPaymentState("failed");
          setPaymentError(
            err?.message ??
              "We couldn't confirm your payment just now. If money was deducted, it will be verified automatically shortly — check back in a minute before retrying.",
          );
        }
      },
      onFailure: (reason) => {
        setPaymentState("failed");
        setPaymentError(reason);
      },
      onCancel: () => {
        setPaymentState("cancelled");
      },
    });
  }

  if (!order) return <p className="opacity-60">Loading order...</p>;

  const step = currentStep(order.status);
  const isPending = order.status === OrderStatus.PAYMENT_PENDING;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="glass-card p-5">
        <h1 className="text-lg font-bold mb-4">Order #{order.id.slice(0, 8)}</h1>

        {order.status === OrderStatus.CANCELLED ? (
          <p className="text-red-500 font-medium">This order was cancelled.</p>
        ) : isPending ? (
          <div className="text-center space-y-3">
            <p className="text-sm opacity-70">Complete payment to confirm your order</p>
            <p className="text-3xl font-bold">₹{order.grandTotal.toFixed(2)}</p>
            {paymentState === "failed" && (
              <p className="text-red-500 text-sm">{paymentError}</p>
            )}
            {paymentState === "cancelled" && (
              <p className="text-sm" style={{ color: "var(--portal-secondary)" }}>
                Payment was cancelled.
              </p>
            )}
            <button
              onClick={handlePayNow}
              disabled={paymentState === "processing" || !paymentInfo}
              className="portal-btn-primary w-full py-3 text-sm disabled:opacity-50"
            >
              {paymentState === "processing"
                ? "Waiting for payment..."
                : paymentState === "failed" || paymentState === "cancelled"
                  ? "Retry Payment"
                  : "Pay Now"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {STEPS.map((s, i) => (
              <div key={s.label} className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white shrink-0"
                  style={{
                    background: i <= step ? "var(--portal-primary)" : "var(--portal-border)",
                  }}
                >
                  {i <= step ? "✓" : i + 1}
                </div>
                <span className={i <= step ? "font-medium" : "opacity-50"}>{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {delivery?.driver && (
        <div className="glass-card p-5">
          <h2 className="font-semibold mb-2">Delivery Partner</h2>
          <div className="flex items-center justify-between text-sm">
            <div>
              <div className="font-medium">{delivery.driver.name}</div>
              <div className="opacity-60 text-xs">
                {delivery.driver.vehicleType} · {delivery.driver.vehicleNumber} · ★{" "}
                {delivery.driver.rating?.toFixed(1)}
              </div>
            </div>
            {delivery.driver.phone && (
              <a href={`tel:${delivery.driver.phone}`} className="portal-btn-primary px-3 py-1.5 text-xs">
                📞 Call
              </a>
            )}
          </div>
          {location && (
            <p className="text-xs opacity-50 mt-2">
              Live location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </p>
          )}
          {delivery.dropOtp && (
            <div className="mt-3 text-xs opacity-70">
              Share this OTP with your delivery partner on arrival:{" "}
              <span className="font-bold text-base tracking-widest" style={{ color: "var(--portal-primary)" }}>
                {delivery.dropOtp}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="glass-card p-5 text-sm">
        <h2 className="font-semibold mb-2">Bill Summary</h2>
        <div className="flex justify-between opacity-80">
          <span>Item Total</span>
          <span>₹{order.itemTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between opacity-80">
          <span>Delivery + Fees</span>
          <span>
            ₹{(order.deliveryFee + order.packagingFee + order.platformFee + order.taxAmount).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between font-bold border-t mt-2 pt-2" style={{ borderColor: "var(--portal-border)" }}>
          <span>Grand Total</span>
          <span>₹{order.grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {CANCELLABLE_STATUSES.includes(order.status) && (
        <button onClick={cancelOrder} className="w-full py-2 text-sm text-red-500 glass-card">
          Cancel Order
        </button>
      )}
    </div>
  );
}
