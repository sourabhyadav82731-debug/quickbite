"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PaymentMethod } from "@quickbite/types";
import {
  DELIVERY_FEE_BASE,
  FREE_DELIVERY_THRESHOLD,
  GST_RATE,
  PACKAGING_FEE,
  PLATFORM_FEE,
  TIP_PRESETS,
} from "@quickbite/config";
import { apiClient, api } from "@/lib/api";
import { useCartStore } from "@/lib/cart-store";

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: PaymentMethod.UPI, label: "UPI (GPay / PhonePe / Paytm)" },
  { value: PaymentMethod.CARD, label: "Card (Razorpay / Stripe)" },
  { value: PaymentMethod.NET_BANKING, label: "Net Banking" },
  { value: PaymentMethod.COD, label: "Cash on Delivery" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { restaurantId, items, total, clear } = useCartStore();
  const { data: myAddresses } = useQuery({
    queryKey: ["my-addresses"],
    queryFn: () => apiClient.get("/addresses"),
  });

  const [addressId, setAddressId] = useState<string>("");
  const [tip, setTip] = useState(0);
  const [customTip, setCustomTip] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.UPI);
  const [instructions, setInstructions] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemTotal = total();
  const deliveryFee = itemTotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE_BASE;
  const taxAmount = Math.round(itemTotal * GST_RATE * 100) / 100;
  const grandTotal =
    itemTotal + deliveryFee + PACKAGING_FEE + PLATFORM_FEE + taxAmount + tip - couponDiscount;

  async function applyCoupon() {
    if (!couponCode) return;
    try {
      const res: any = await api.coupons.validate(couponCode, itemTotal);
      if (res.valid) {
        setCouponDiscount(res.discount);
        setCouponMessage(`Coupon applied: -₹${res.discount.toFixed(0)}`);
      } else {
        setCouponDiscount(0);
        setCouponMessage("Coupon not valid for this order");
      }
    } catch {
      setCouponMessage("Coupon not found");
    }
  }

  async function placeOrder() {
    if (!addressId) {
      setError("Select a delivery address");
      return;
    }
    setPlacing(true);
    setError(null);
    try {
      const order: any = await api.orders.checkout({
        restaurantId,
        addressId,
        items,
        couponCode: couponCode || undefined,
        paymentMethod,
        tipAmount: tip,
        specialInstructions: instructions || undefined,
      });
      clear();
      router.push(`/customer/orders/${order.id}`);
    } catch (err: any) {
      setError(err?.message ?? "Failed to place order");
    } finally {
      setPlacing(false);
    }
  }

  if (items.length === 0) {
    return <div className="glass-card p-10 text-center opacity-60">Your cart is empty.</div>;
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <h1 className="text-xl font-bold">Checkout</h1>

      <section className="glass-card p-4">
        <h2 className="font-semibold mb-2 text-sm">Delivery Address</h2>
        <div className="space-y-2">
          {((myAddresses as any[]) ?? []).map((a) => (
            <label key={a.id} className="flex items-start gap-2 text-sm">
              <input
                type="radio"
                name="address"
                checked={addressId === a.id}
                onChange={() => setAddressId(a.id)}
                className="mt-1"
              />
              <span>
                <b>{a.label}</b> — {a.line1}, {a.city} {a.pincode}
              </span>
            </label>
          ))}
          {!myAddresses || (myAddresses as any[]).length === 0 ? (
            <p className="text-xs opacity-60">
              No saved addresses. Add one from the Addresses page first.
            </p>
          ) : null}
        </div>
      </section>

      <section className="glass-card p-4">
        <h2 className="font-semibold mb-2 text-sm">Delivery Tip — 100% goes to your partner</h2>
        <div className="flex gap-2 flex-wrap">
          {TIP_PRESETS.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTip(t);
                setCustomTip("");
              }}
              className="px-3 py-1.5 rounded-lg text-sm glass-card"
              style={{ background: tip === t ? "var(--portal-primary)" : undefined, color: tip === t ? "white" : undefined }}
            >
              ₹{t}
            </button>
          ))}
          <input
            placeholder="Custom"
            value={customTip}
            onChange={(e) => {
              setCustomTip(e.target.value);
              setTip(Number(e.target.value) || 0);
            }}
            className="w-20 px-2 py-1.5 rounded-lg text-sm glass-card"
          />
        </div>
      </section>

      <section className="glass-card p-4">
        <h2 className="font-semibold mb-2 text-sm">Coupon</h2>
        <div className="flex gap-2">
          <input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Enter coupon code"
            className="flex-1 px-3 py-2 rounded-lg text-sm glass-card"
          />
          <button onClick={applyCoupon} className="portal-btn-primary px-4 text-sm">
            Apply
          </button>
        </div>
        {couponMessage && <p className="text-xs mt-1 opacity-70">{couponMessage}</p>}
      </section>

      <section className="glass-card p-4">
        <h2 className="font-semibold mb-2 text-sm">Payment Method</h2>
        <div className="space-y-1">
          {PAYMENT_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === opt.value}
                onChange={() => setPaymentMethod(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </section>

      <textarea
        placeholder="Any note for the restaurant?"
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        className="w-full glass-card p-3 text-sm"
        rows={2}
      />

      <section className="glass-card p-4 text-sm space-y-1">
        <BillRow label="Item Total" value={itemTotal} />
        <BillRow label="Delivery Fee" value={deliveryFee} note={deliveryFee === 0 ? "Free" : undefined} />
        <BillRow label="Packaging Fee" value={PACKAGING_FEE} />
        <BillRow label="Platform Fee" value={PLATFORM_FEE} />
        <BillRow label="GST & Taxes" value={taxAmount} />
        {couponDiscount > 0 && <BillRow label="Coupon Discount" value={-couponDiscount} />}
        {tip > 0 && <BillRow label="Delivery Tip" value={tip} />}
        <div className="border-t pt-2 mt-1 flex justify-between font-bold" style={{ borderColor: "var(--portal-border)" }}>
          <span>Grand Total</span>
          <span>₹{grandTotal.toFixed(2)}</span>
        </div>
      </section>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        onClick={placeOrder}
        disabled={placing}
        className="portal-btn-primary w-full py-3 text-sm disabled:opacity-50"
      >
        {placing ? "Placing order..." : `Place Order · ₹${grandTotal.toFixed(2)}`}
      </button>
    </div>
  );
}

function BillRow({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div className="flex justify-between opacity-80">
      <span>{label}</span>
      <span>{note ?? `₹${value.toFixed(2)}`}</span>
    </div>
  );
}
