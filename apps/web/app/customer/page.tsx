"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { api, API_URL } from "@/lib/api";

function resolveUrl(url?: string | null) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_URL}${url}`;
}

const CATEGORIES: { label: string; emoji: string }[] = [
  { label: "Biryani", emoji: "🍛" },
  { label: "Burgers", emoji: "🍔" },
  { label: "Pizzas", emoji: "🍕" },
  { label: "Rolls", emoji: "🌯" },
  { label: "South Indian", emoji: "🥘" },
  { label: "Desserts", emoji: "🍰" },
  { label: "Healthy", emoji: "🥗" },
  { label: "Chinese", emoji: "🥡" },
  { label: "Beverages", emoji: "🥤" },
];

// Same exact wording as before — only the visual presentation (per-segment
// color/emphasis) changed. Each headline/subtitle below still reads, word
// for word, identically to the plain-string version it replaced:
//   "50% OFF up to ₹100" / "Use code WELCOME50"
//   "Free Delivery on First 3 Orders" / "New users only"
//   "Gourmet Week" / "Curated premium restaurants"
const BANNERS = [
  {
    key: "50% OFF up to ₹100",
    headline: (
      <>
        <span className="qb-promo-highlight text-3xl font-extrabold block leading-none">50% OFF</span>
        <span className="qb-promo-accent text-base font-semibold">
          up to <span className="qb-promo-highlight">₹100</span>
        </span>
      </>
    ),
    subtitle: (
      <span className="qb-promo-muted">
        Use code <span className="qb-promo-code">WELCOME50</span>
      </span>
    ),
  },
  {
    key: "Free Delivery on First 3 Orders",
    headline: (
      <>
        <span className="qb-promo-glow-text">Free Delivery</span> on{" "}
        <span className="qb-promo-accent">First 3 Orders</span>
      </>
    ),
    subtitle: <span className="qb-promo-muted">New users only</span>,
  },
  {
    key: "Gourmet Week",
    headline: <span className="qb-promo-glow-text">Gourmet Week</span>,
    subtitle: <span className="qb-promo-muted">Curated premium restaurants</span>,
  },
];

export default function DiscoverPage() {
  const [search, setSearch] = useState("");
  const { data: restaurants, isLoading } = useQuery({
    queryKey: ["restaurants", search],
    queryFn: () => api.restaurants.list(search ? `?search=${encodeURIComponent(search)}` : ""),
  });

  const list = (restaurants as any[]) ?? [];
  const topRated = list.filter((r) => r.rating >= 4.5);
  const fastDelivery = list.filter((r) => r.avgPrepTimeMinutes < 30);
  const budget = list.filter((r) => r.costForTwo < 400);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest" style={{ color: "var(--qb-text-muted)" }}>
          Delivering to you
        </p>
        <h1 className="font-heading text-3xl sm:text-4xl leading-tight mt-1">
          What&apos;s your
          <br />
          craving?
        </h1>
        <p className="text-sm italic mt-1" style={{ color: "var(--qb-text-secondary)" }}>
          &ldquo;We&apos;ve got it.&rdquo;
        </p>
      </div>

      <div className="relative">
        <span
          className="absolute left-4 top-1/2 -translate-y-1/2 text-base pointer-events-none"
          style={{ color: "var(--qb-primary)" }}
          aria-hidden="true"
        >
          🔍
        </span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search for biryani, pizza, burgers..."
          className="w-full glass-card pl-11 pr-4 py-3 outline-none"
        />
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {CATEGORIES.map((c) => (
          <div key={c.label} className="shrink-0 flex flex-col items-center gap-1.5 w-16">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl glass-card"
              style={{ borderColor: "var(--qb-black)" }}
            >
              {c.emoji}
            </div>
            <span className="text-xs font-medium text-center leading-tight">{c.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {BANNERS.map((b) => (
          <div key={b.key} className="qb-promo-card rounded-2xl p-5 text-white">
            <div className="font-bold text-lg">{b.headline}</div>
            <div className="text-sm mt-0.5">{b.subtitle}</div>
          </div>
        ))}
      </div>

      {isLoading && <p className="opacity-60">Loading restaurants...</p>}

      <RestaurantSection title="Restaurants Near You" restaurants={list} />
      <RestaurantSection title="Top-Rated (4.5+)" restaurants={topRated} />
      <RestaurantSection title="Fast Delivery (<30 mins)" restaurants={fastDelivery} />
      <RestaurantSection title="Budget Eats (<₹400 for two)" restaurants={budget} />
    </div>
  );
}

function RestaurantSection({ title, restaurants }: { title: string; restaurants: any[] }) {
  if (!restaurants.length) return null;
  return (
    <section>
      <h2 className="text-lg font-bold mb-3">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {restaurants.map((r) => (
          <Link
            key={r.id}
            href={`/customer/restaurants/${r.id}`}
            className="glass-card p-4 block hover:-translate-y-0.5 transition-transform"
          >
            {r.coverImageUrl ? (
              <div
                className="w-full h-32 rounded-xl overflow-hidden mb-3"
                style={{ background: "var(--qb-elevated)" }}
              >
                <img
                  src={resolveUrl(r.coverImageUrl) ?? ""}
                  alt={r.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div
                className="w-full h-32 rounded-xl mb-3 flex items-center justify-center text-3xl opacity-30"
                style={{ background: "var(--qb-elevated)" }}
              >
                🍽️
              </div>
            )}
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">{r.name}</span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: "var(--qb-primary)", color: "var(--qb-cream)" }}
              >
                <span style={{ color: "var(--qb-glow)" }}>★</span> {r.rating.toFixed(1)}
              </span>
            </div>
            <div className="text-sm opacity-70 mb-1">{r.cuisines.join(", ")}</div>
            <div className="flex items-center justify-between text-xs">
              <span
                className="font-bold px-2 py-0.5 rounded-full"
                style={{ background: "var(--qb-glow)", color: "#171313" }}
              >
                {r.avgPrepTimeMinutes} mins
              </span>
              <span className="opacity-60">₹{r.costForTwo} for two</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
