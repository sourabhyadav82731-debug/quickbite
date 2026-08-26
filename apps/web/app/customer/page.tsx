"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";

const CATEGORIES = [
  "Biryani",
  "Burgers",
  "Pizzas",
  "Rolls",
  "South Indian",
  "Desserts",
  "Healthy",
  "Chinese",
  "Beverages",
];

const BANNERS = [
  { title: "50% OFF up to ₹100", subtitle: "Use code WELCOME50", color: "#FF6B35" },
  { title: "Free Delivery on First 3 Orders", subtitle: "New users only", color: "#FFB534" },
  { title: "Gourmet Week", subtitle: "Curated premium restaurants", color: "#00B894" },
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
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search restaurants, cuisines, dishes..."
        className="w-full glass-card px-4 py-3 outline-none"
      />

      <div className="flex gap-3 overflow-x-auto pb-2">
        {CATEGORIES.map((c) => (
          <div
            key={c}
            className="shrink-0 px-4 py-2 rounded-full text-sm font-medium glass-card"
          >
            {c}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {BANNERS.map((b) => (
          <div
            key={b.title}
            className="rounded-2xl p-5 text-white"
            style={{ background: b.color }}
          >
            <div className="font-bold text-lg">{b.title}</div>
            <div className="text-sm opacity-90">{b.subtitle}</div>
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
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">{r.name}</span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: "var(--portal-primary)" }}
              >
                ★ {r.rating.toFixed(1)}
              </span>
            </div>
            <div className="text-sm opacity-70 mb-1">{r.cuisines.join(", ")}</div>
            <div className="flex items-center justify-between text-xs opacity-60">
              <span>{r.avgPrepTimeMinutes} mins</span>
              <span>₹{r.costForTwo} for two</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
