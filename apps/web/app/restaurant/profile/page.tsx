"use client";

import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useRestaurant } from "@/lib/restaurant-context";
import { LocationPicker } from "@/components/location-picker";
import { useAssistantLanguage } from "@/lib/use-assistant-language";

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  PENDING_APPROVAL: "Pending Approval",
  SUSPENDED: "Suspended",
  CLOSED: "Closed",
};

export default function RestaurantProfilePage() {
  const { active } = useRestaurant();
  const qc = useQueryClient();
  const { language } = useAssistantLanguage();

  if (!active) return <p className="opacity-60">No restaurant found for this account.</p>;

  async function toggleAccepting() {
    await apiClient.patch(`/restaurants/${active!.id}`, {
      isAcceptingOrders: !active!.isAcceptingOrders,
    });
    qc.invalidateQueries({ queryKey: ["my-restaurants"] });
  }

  async function saveLocation(coords: { lat: number; lng: number }) {
    await apiClient.patch(`/restaurants/${active!.id}`, { lat: coords.lat, lng: coords.lng });
    qc.invalidateQueries({ queryKey: ["my-restaurants"] });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Restaurant Profile</h1>
        <p className="text-sm opacity-60">Your registered details on Quickbits.</p>
      </div>

      <div className="d3-hero p-6">
        <div className="text-2xl font-bold mb-1">{active.name}</div>
        <div className="text-sm opacity-90">{active.cuisines?.join(" · ")}</div>
        <div className="flex items-center gap-3 mt-3 text-sm">
          <span>★ {active.rating.toFixed(1)} ({active.ratingCount})</span>
          <span
            className="text-[10px] font-semibold px-2 py-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.25)" }}
          >
            {STATUS_LABEL[active.status] ?? active.status}
          </span>
        </div>
      </div>

      {active.description && (
        <div className="d3-card p-4">
          <div className="text-xs opacity-60 mb-1">Description</div>
          <p className="text-sm">{active.description}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <InfoCard label="Avg Prep Time" value={`${active.avgPrepTimeMinutes} min`} />
        <InfoCard label="Cost for Two" value={`₹${active.costForTwo}`} />
        <InfoCard label="Delivery Radius" value={`${active.deliveryRadiusKm} km`} />
        <InfoCard label="Commission Rate" value={`${(active.commissionRate * 100).toFixed(0)}%`} />
      </div>

      {active.fssaiLicense && (
        <div className="d3-card p-4 flex items-center justify-between text-sm">
          <span className="opacity-60">FSSAI License</span>
          <span className="font-medium">{active.fssaiLicense}</span>
        </div>
      )}

      <div className="d3-card p-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Order Acceptance</div>
          <p className="text-xs opacity-60">Toggle whether new orders can come in.</p>
        </div>
        <button
          onClick={toggleAccepting}
          className="d3-btn px-4 py-2 rounded-xl text-xs font-semibold text-white"
          style={{ background: active.isAcceptingOrders ? "linear-gradient(135deg,#00b894,#00d9a3)" : "#95a5a6" }}
        >
          {active.isAcceptingOrders ? "Accepting Orders" : "Store Closed"}
        </button>
      </div>

      <div className="d3-card p-4 space-y-2">
        <div className="text-sm font-medium">Restaurant Location</div>
        <p className="text-xs opacity-60">
          Used for delivery-radius and driver-distance calculations.
          {active.lat !== 0 || active.lng !== 0
            ? ` Current: ${active.lat.toFixed(5)}, ${active.lng.toFixed(5)}`
            : " Not set yet."}
        </p>
        <LocationPicker language={language} onUseLocation={saveLocation} onEditManually={saveLocation} />
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="d3-card p-4">
      <div className="text-xs opacity-60 mb-1">{label}</div>
      <div className="font-bold">{value}</div>
    </div>
  );
}
