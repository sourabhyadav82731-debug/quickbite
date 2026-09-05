"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { DayHours } from "@quickbite/types";
import { api, friendlyErrorMessage } from "@/lib/api";
import { useRestaurant } from "@/lib/restaurant-context";
import { AvailabilityControl } from "@/components/availability-control";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function defaultHours(): DayHours[] {
  return Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    open: "10:00",
    close: "23:00",
    closed: false,
  }));
}

export default function HoursPage() {
  const { active } = useRestaurant();
  const qc = useQueryClient();
  const [hours, setHours] = useState<DayHours[]>(defaultHours());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: holidays } = useQuery({
    queryKey: ["restaurant-holidays", active?.id],
    queryFn: () => api.restaurants.listHolidays(active.id),
    enabled: !!active,
  });
  const [newDate, setNewDate] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [holidayError, setHolidayError] = useState<string | null>(null);

  useEffect(() => {
    if (active?.hours && Array.isArray(active.hours) && active.hours.length === 7) {
      setHours(active.hours);
    }
  }, [active?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveHours() {
    if (!active) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.restaurants.update(active.id, { hours });
      await qc.invalidateQueries({ queryKey: ["my-restaurants"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(friendlyErrorMessage(err, "Could not save hours"));
    } finally {
      setSaving(false);
    }
  }

  async function addHoliday() {
    if (!active || !newDate || !newLabel.trim()) {
      setHolidayError("Pick a date and enter a label");
      return;
    }
    setHolidayError(null);
    try {
      await api.restaurants.addHoliday(active.id, { date: newDate, label: newLabel.trim() });
      setNewDate("");
      setNewLabel("");
      qc.invalidateQueries({ queryKey: ["restaurant-holidays", active.id] });
    } catch (err) {
      setHolidayError(friendlyErrorMessage(err, "Could not add holiday"));
    }
  }

  async function removeHoliday(holidayId: string) {
    if (!active) return;
    await api.restaurants.deleteHoliday(active.id, holidayId);
    qc.invalidateQueries({ queryKey: ["restaurant-holidays", active.id] });
  }

  if (!active) return <p className="opacity-60">No restaurant found for this account.</p>;

  const holidayList = (holidays as any[]) ?? [];

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <h1 className="text-xl font-bold">Hours & Holidays</h1>
        <p className="text-xs opacity-60">Persisted to your restaurant profile — customers see this too.</p>
      </div>

      <AvailabilityControl restaurant={active} />

      <div className="glass-card p-4 space-y-2">
        <h2 className="text-sm font-semibold mb-1">Weekly Hours</h2>
        {hours
          .slice()
          .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
          .map((day) => (
            <div key={day.dayOfWeek} className="flex items-center gap-3 text-sm">
              <span className="w-10">{DAY_LABELS[day.dayOfWeek]}</span>
              <input
                type="time"
                value={day.open}
                disabled={day.closed}
                onChange={(e) =>
                  setHours((prev) =>
                    prev.map((d) => (d.dayOfWeek === day.dayOfWeek ? { ...d, open: e.target.value } : d)),
                  )
                }
                className="glass-card px-2 py-1 text-xs disabled:opacity-40"
              />
              <span>–</span>
              <input
                type="time"
                value={day.close}
                disabled={day.closed}
                onChange={(e) =>
                  setHours((prev) =>
                    prev.map((d) => (d.dayOfWeek === day.dayOfWeek ? { ...d, close: e.target.value } : d)),
                  )
                }
                className="glass-card px-2 py-1 text-xs disabled:opacity-40"
              />
              <label className="flex items-center gap-1 text-xs ml-auto" style={{ minHeight: 44 }}>
                <input
                  type="checkbox"
                  checked={day.closed}
                  onChange={(e) =>
                    setHours((prev) =>
                      prev.map((d) => (d.dayOfWeek === day.dayOfWeek ? { ...d, closed: e.target.checked } : d)),
                    )
                  }
                />
                Closed
              </label>
            </div>
          ))}
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          onClick={saveHours}
          disabled={saving}
          className="portal-btn-primary w-full py-2.5 text-sm rounded-xl disabled:opacity-50"
          style={{ minHeight: 44 }}
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save Hours"}
        </button>
      </div>

      <div className="glass-card p-4 space-y-3">
        <h2 className="text-sm font-semibold">Holidays</h2>
        <p className="text-xs opacity-60">
          Your restaurant automatically shows as closed to customers on these dates.
        </p>
        <div className="space-y-1.5">
          {holidayList.map((h) => (
            <div key={h.id} className="flex items-center justify-between text-sm glass-card px-3 py-2">
              <span>
                {new Date(h.date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })} — {h.label}
              </span>
              <button
                onClick={() => removeHoliday(h.id)}
                className="text-xs opacity-60 hover:opacity-100"
                style={{ minWidth: 44, minHeight: 32 }}
              >
                Remove
              </button>
            </div>
          ))}
          {holidayList.length === 0 && <p className="text-xs opacity-50">No holidays configured.</p>}
        </div>
        <div className="flex gap-2 items-center pt-1">
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="glass-card px-2 py-1.5 text-xs"
          />
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Reason (e.g. Christmas)"
            className="flex-1 glass-card px-2 py-1.5 text-xs"
          />
          <button onClick={addHoliday} className="portal-btn-primary px-3 py-1.5 text-xs rounded-lg" style={{ minHeight: 36 }}>
            Add
          </button>
        </div>
        {holidayError && <p className="text-xs text-red-500">{holidayError}</p>}
      </div>
    </div>
  );
}
