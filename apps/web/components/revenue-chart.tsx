"use client";

import { useId, useState } from "react";

export interface RevenueDay {
  date: string; // "YYYY-MM-DD"
  label: string; // "Mon"
  revenue: number;
  orderCount: number;
}

/** Real 7-day revenue as a smooth area chart — every point comes from
 *  `days`, nothing here is generated or estimated. A day with no delivered
 *  orders still renders as a ₹0 point (never dropped from the axis), so the
 *  week is always exactly 7 points wide. */
export function RevenueChart({ days }: { days: RevenueDay[] }) {
  const gradientId = useId();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 560;
  const height = 180;
  const padX = 24;
  const padY = 20;
  const max = Math.max(1, ...days.map((d) => d.revenue));

  const points = days.map((d, i) => {
    const x = padX + (i / Math.max(1, days.length - 1)) * (width - padX * 2);
    const y = height - padY - (d.revenue / max) * (height - padY * 2);
    return { x, y, day: d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? padX} ${height - padY} L ${points[0]?.x ?? padX} ${height - padY} Z`;

  const hovered = hoverIdx != null ? points[hoverIdx] : null;

  return (
    <div className="relative">
      {/* Text summary for screen readers / accessibility — the SVG below is
          purely decorative (aria-hidden), this list is the real content. */}
      <ul className="sr-only">
        {days.map((d) => (
          <li key={d.date}>
            {d.label}: ₹{d.revenue.toFixed(0)} from {d.orderCount} order{d.orderCount === 1 ? "" : "s"}
          </li>
        ))}
      </ul>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        aria-hidden="true"
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--qb-primary)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--qb-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={padX}
            x2={width - padX}
            y1={padY + f * (height - padY * 2)}
            y2={padY + f * (height - padY * 2)}
            stroke="var(--qb-border)"
            strokeWidth="1"
          />
        ))}

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path d={linePath} fill="none" stroke="var(--qb-primary)" strokeWidth="2.5" strokeLinejoin="round" />

        {points.map((p, i) => (
          <g key={days[i].date}>
            <rect
              x={p.x - (width / days.length) / 2}
              y={0}
              width={width / days.length}
              height={height}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
              style={{ cursor: "pointer" }}
            />
            <circle
              cx={p.x}
              cy={p.y}
              r={hoverIdx === i ? 5 : 3}
              fill="var(--qb-primary)"
              stroke="var(--qb-bg)"
              strokeWidth="1.5"
            />
          </g>
        ))}

        {hovered && (
          <line
            x1={hovered.x}
            x2={hovered.x}
            y1={padY}
            y2={height - padY}
            stroke="var(--qb-primary)"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.5"
          />
        )}
      </svg>

      <div className="flex justify-between text-[10px] opacity-60 px-1 -mt-1">
        {days.map((d) => (
          <span key={d.date}>{d.label}</span>
        ))}
      </div>

      {hovered && (
        <div
          className="absolute pointer-events-none px-2.5 py-1.5 rounded-lg text-xs glass-card shadow-lg"
          style={{
            left: `${(hovered.x / width) * 100}%`,
            top: 0,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="font-semibold">{hovered.day.label}</div>
          <div>₹{hovered.day.revenue.toFixed(0)}</div>
          <div className="opacity-60">
            {hovered.day.orderCount} order{hovered.day.orderCount === 1 ? "" : "s"}
          </div>
        </div>
      )}
    </div>
  );
}
