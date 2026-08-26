"use client";

import { useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function HoursPage() {
  const [hours, setHours] = useState(
    Object.fromEntries(DAYS.map((d) => [d, { open: "10:00", close: "23:00", closed: false }])),
  );
  const [pauseMinutes, setPauseMinutes] = useState<number | null>(null);

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-bold">Operating Hours</h1>
      <p className="text-xs opacity-60">
        UI-only in this build — persisting hours/holiday mode to the backend is planned for a
        future pass.
      </p>

      <div className="glass-card p-4 space-y-2">
        {DAYS.map((day) => (
          <div key={day} className="flex items-center gap-3 text-sm">
            <span className="w-10">{day}</span>
            <input
              type="time"
              value={hours[day].open}
              disabled={hours[day].closed}
              onChange={(e) => setHours({ ...hours, [day]: { ...hours[day], open: e.target.value } })}
              className="glass-card px-2 py-1 text-xs"
            />
            <span>–</span>
            <input
              type="time"
              value={hours[day].close}
              disabled={hours[day].closed}
              onChange={(e) => setHours({ ...hours, [day]: { ...hours[day], close: e.target.value } })}
              className="glass-card px-2 py-1 text-xs"
            />
            <label className="flex items-center gap-1 text-xs ml-auto">
              <input
                type="checkbox"
                checked={hours[day].closed}
                onChange={(e) => setHours({ ...hours, [day]: { ...hours[day], closed: e.target.checked } })}
              />
              Closed
            </label>
          </div>
        ))}
      </div>

      <div className="glass-card p-4 flex items-center justify-between">
        <span className="text-sm font-medium">Temporary 30-min pause</span>
        <button
          onClick={() => setPauseMinutes(pauseMinutes ? null : 30)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
          style={{ background: pauseMinutes ? "#e74040" : "#00B894" }}
        >
          {pauseMinutes ? "Resume Orders" : "Pause Orders"}
        </button>
      </div>
    </div>
  );
}
