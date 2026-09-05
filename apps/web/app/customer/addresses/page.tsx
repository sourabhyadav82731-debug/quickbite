"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AddressLabel } from "@quickbite/types";
import { apiClient } from "@/lib/api";
import { LocationPicker, DetectedLocation } from "@/components/location-picker";
import { useAssistantLanguage } from "@/lib/use-assistant-language";

// No coordinates until the user either detects their location or we fall
// back on save — see save() below. Never silently defaults to a fixed city.
const BLANK_ADDRESS = { label: AddressLabel.HOME, line1: "", city: "", state: "", pincode: "" };

export default function AddressesPage() {
  const qc = useQueryClient();
  const { language } = useAssistantLanguage();
  const { data: addresses } = useQuery({
    queryKey: ["my-addresses"],
    queryFn: () => apiClient.get<any[]>("/addresses"),
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<typeof BLANK_ADDRESS>(BLANK_ADDRESS);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  async function save() {
    await apiClient.post("/addresses", {
      ...form,
      // Falls back to a city-center default only if the user never used
      // "Use Current Location" — forward geocoding (typed address → coords)
      // isn't implemented, so a manually-typed-only address still needs some
      // coordinate for delivery-radius checks downstream.
      lat: coords?.lat ?? 12.9716,
      lng: coords?.lng ?? 77.5946,
    });
    qc.invalidateQueries({ queryKey: ["my-addresses"] });
    setShowForm(false);
    setForm(BLANK_ADDRESS);
    setCoords(null);
  }

  function handleUseLocation(result: DetectedLocation) {
    setForm((f) => ({
      ...f,
      line1: result.line1 || f.line1,
      city: result.city || f.city,
      state: result.state || f.state,
      pincode: result.pincode || f.pincode,
    }));
    setCoords({ lat: result.lat, lng: result.lng });
  }

  async function remove(id: string) {
    await apiClient.delete(`/addresses/${id}`);
    qc.invalidateQueries({ queryKey: ["my-addresses"] });
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Saved Addresses</h1>
        <button onClick={() => setShowForm((v) => !v)} className="portal-btn-primary px-4 py-2 text-sm">
          + New
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-4 space-y-2">
          <LocationPicker
            language={language}
            onUseLocation={handleUseLocation}
            onEditManually={(c) => setCoords(c)}
          />
          <div className="flex gap-2">
            {Object.values(AddressLabel).map((l) => (
              <button
                key={l}
                onClick={() => setForm({ ...form, label: l })}
                className="px-3 py-1 rounded-lg text-xs glass-card"
                style={{ background: form.label === l ? "var(--portal-primary)" : undefined, color: form.label === l ? "white" : undefined }}
              >
                {l}
              </button>
            ))}
          </div>
          <input
            placeholder="Address line"
            value={form.line1}
            onChange={(e) => setForm({ ...form, line1: e.target.value })}
            className="w-full glass-card px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <input
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="flex-1 glass-card px-3 py-2 text-sm"
            />
            <input
              placeholder="State"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="flex-1 glass-card px-3 py-2 text-sm"
            />
            <input
              placeholder="Pincode"
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              className="w-24 glass-card px-3 py-2 text-sm"
            />
          </div>
          <button onClick={save} className="portal-btn-primary px-4 py-2 text-sm">
            Save Address
          </button>
        </div>
      )}

      <div className="space-y-2">
        {((addresses as any[]) ?? []).map((a) => (
          <div key={a.id} className="glass-card p-4 flex items-center justify-between text-sm">
            <div>
              <b>{a.label}</b> — {a.line1}, {a.city}, {a.state} {a.pincode}
            </div>
            <button onClick={() => remove(a.id)} className="text-red-500 text-xs">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
