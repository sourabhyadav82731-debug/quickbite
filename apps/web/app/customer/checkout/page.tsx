"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AddressLabel, PaymentMethod } from "@quickbite/types";
import {
  DELIVERY_FEE_BASE,
  FREE_DELIVERY_THRESHOLD,
  GST_RATE,
  PACKAGING_FEE,
  PLATFORM_FEE,
  TIP_PRESETS,
} from "@quickbite/config";
import { apiClient, api, friendlyErrorMessage } from "@/lib/api";
import { useCartStore } from "@/lib/cart-store";
import { LocationPicker, DetectedLocation } from "@/components/location-picker";
import { useAssistantLanguage } from "@/lib/use-assistant-language";
import { DessertUpsell } from "@/components/dessert-upsell";

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: PaymentMethod.COD, label: "Cash on Delivery" },
  { value: PaymentMethod.UPI, label: "UPI (GPay / PhonePe / Paytm)" },
  { value: PaymentMethod.CARD, label: "Card (Razorpay)" },
  { value: PaymentMethod.NET_BANKING, label: "Net Banking" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { language } = useAssistantLanguage();
  const { restaurantId, items, total, clear } = useCartStore();
  const { data: myAddresses } = useQuery({
    queryKey: ["my-addresses"],
    queryFn: () => apiClient.get("/addresses"),
  });

  const [addressId, setAddressId] = useState<string>("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: AddressLabel.HOME,
    line1: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [newAddressCoords, setNewAddressCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [tip, setTip] = useState(0);
  const [customTip, setCustomTip] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.COD);
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

  async function saveNewAddress() {
    if (!newAddress.line1 || !newAddress.city || !newAddress.state || !newAddress.pincode) {
      setAddressError("Fill in all address fields");
      return;
    }
    setSavingAddress(true);
    setAddressError(null);
    try {
      // Falls back to a city-center default only if the user never used "Use
      // Current Location" below — forward geocoding (typed address → coords)
      // isn't implemented, so a manually-typed address still needs some
      // coordinate for delivery-radius checks downstream.
      const saved: any = await apiClient.post("/addresses", {
        ...newAddress,
        lat: newAddressCoords?.lat ?? 12.9716,
        lng: newAddressCoords?.lng ?? 77.5946,
      });
      await qc.invalidateQueries({ queryKey: ["my-addresses"] });
      setAddressId(saved.id);
      setShowAddressForm(false);
      setNewAddress({ label: AddressLabel.HOME, line1: "", city: "", state: "", pincode: "" });
      setNewAddressCoords(null);
    } catch (err: any) {
      setAddressError(friendlyErrorMessage(err, "Could not save address"));
    } finally {
      setSavingAddress(false);
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
      setError(friendlyErrorMessage(err, "Failed to place order. Please try again."));
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
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-sm">Delivery Address</h2>
          {!showAddressForm && (
            <button onClick={() => setShowAddressForm(true)} className="text-xs opacity-70 underline">
              + Add new
            </button>
          )}
        </div>
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
          {(!myAddresses || (myAddresses as any[]).length === 0) && !showAddressForm ? (
            <p className="text-xs opacity-60">No saved addresses yet — add one to continue.</p>
          ) : null}
        </div>

        {showAddressForm && (
          <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: "var(--portal-border)" }}>
            <LocationPicker
              language={language}
              onUseLocation={(result: DetectedLocation) => {
                setNewAddress((a) => ({
                  ...a,
                  line1: result.line1 || a.line1,
                  city: result.city || a.city,
                  state: result.state || a.state,
                  pincode: result.pincode || a.pincode,
                }));
                setNewAddressCoords({ lat: result.lat, lng: result.lng });
              }}
              onEditManually={(c) => setNewAddressCoords(c)}
            />
            <div className="flex gap-2">
              {Object.values(AddressLabel).map((l) => (
                <button
                  key={l}
                  onClick={() => setNewAddress({ ...newAddress, label: l })}
                  className="px-3 py-1 rounded-lg text-xs glass-card"
                  style={{
                    background: newAddress.label === l ? "var(--portal-primary)" : undefined,
                    color: newAddress.label === l ? "white" : undefined,
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
            <input
              placeholder="Address line"
              value={newAddress.line1}
              onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
              className="w-full glass-card px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <input
                placeholder="City"
                value={newAddress.city}
                onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                className="flex-1 glass-card px-3 py-2 text-sm"
              />
              <input
                placeholder="State"
                value={newAddress.state}
                onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                className="flex-1 glass-card px-3 py-2 text-sm"
              />
              <input
                placeholder="Pincode"
                value={newAddress.pincode}
                onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                className="w-24 glass-card px-3 py-2 text-sm"
              />
            </div>
            {addressError && <p className="text-red-500 text-xs">{addressError}</p>}
            <div className="flex items-center gap-3">
              <button
                onClick={saveNewAddress}
                disabled={savingAddress}
                className="portal-btn-primary px-4 py-2 text-sm disabled:opacity-50"
              >
                {savingAddress ? "Saving..." : "Save Address"}
              </button>
              <button onClick={() => setShowAddressForm(false)} className="text-xs opacity-60">
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="glass-card p-4">
        <h2 className="font-semibold mb-2 text-sm">Order Items</h2>
        <div className="space-y-1.5 text-sm">
          {items.map((item) => (
            <div
              key={`${item.dishId}-${item.addons.map((a) => a.addonId).join(",")}`}
              className="flex justify-between"
            >
              <span className="opacity-80">
                {item.name} × {item.quantity}
              </span>
              <span className="font-medium">
                ₹{((item.unitPrice + item.addons.reduce((s, a) => s + a.price, 0)) * item.quantity).toFixed(0)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {restaurantId && <DessertUpsell restaurantId={restaurantId} cartDishIds={items.map((i) => i.dishId)} />}

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
              style={{ background: tip === t ? "var(--qb-primary)" : undefined, color: tip === t ? "var(--qb-cream)" : undefined }}
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
          <button onClick={applyCoupon} className="qb-btn-cta px-4 text-sm">
            Apply
          </button>
        </div>
        {couponMessage && (
          <p
            className="text-xs mt-1 font-semibold"
            style={
              couponDiscount > 0
                ? { color: "var(--qb-primary)" }
                : { color: "var(--qb-text-muted)" }
            }
          >
            {couponDiscount > 0 && <span style={{ color: "var(--qb-glow)" }}>✓ </span>}
            {couponMessage}
          </p>
        )}
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
          <span style={{ color: "var(--qb-primary)" }}>₹{grandTotal.toFixed(2)}</span>
        </div>
      </section>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        onClick={placeOrder}
        disabled={placing}
        className="qb-btn-cta w-full py-3 text-sm disabled:opacity-50"
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
