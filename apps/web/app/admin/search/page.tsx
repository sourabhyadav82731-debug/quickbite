"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

function SearchResults() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-search", q],
    queryFn: () => api.admin.search(q),
    enabled: q.length >= 2,
  });
  const d = data as any;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-bold">Search results for &ldquo;{q}&rdquo;</h1>

      {q.length < 2 && <p className="text-sm opacity-60">Enter at least 2 characters to search.</p>}
      {isLoading && <p className="text-sm opacity-60">Searching…</p>}

      {d && (
        <>
          <ResultSection title="Orders">
            {d.orders.map((o: any) => (
              <Link key={o.id} href={`/admin/orders/${o.id}`} className="glass-card p-3 text-sm block hover:opacity-80">
                #{o.id.slice(0, 8)} · {o.status.replace(/_/g, " ")} · ₹{o.grandTotal.toFixed(0)}
              </Link>
            ))}
          </ResultSection>
          <ResultSection title="Customers">
            {d.customers.map((c: any) => (
              <Link key={c.id} href={`/admin/customers/${c.id}`} className="glass-card p-3 text-sm block hover:opacity-80">
                {c.name} · {c.email}
              </Link>
            ))}
          </ResultSection>
          <ResultSection title="Restaurants">
            {d.restaurants.map((r: any) => (
              <Link key={r.id} href={`/admin/restaurants/${r.id}`} className="glass-card p-3 text-sm block hover:opacity-80">
                {r.name}
              </Link>
            ))}
          </ResultSection>
          <ResultSection title="Drivers">
            {d.drivers.map((dr: any) => (
              <Link key={dr.id} href={`/admin/drivers/${dr.id}`} className="glass-card p-3 text-sm block hover:opacity-80">
                {dr.name} · {dr.phone ?? dr.email}
              </Link>
            ))}
          </ResultSection>
          <ResultSection title="Coupons">
            {d.coupons.map((c: any) => (
              <div key={c.id} className="glass-card p-3 text-sm">{c.code}</div>
            ))}
          </ResultSection>
        </>
      )}
    </div>
  );
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  const items = Array.isArray(children) ? children : [children];
  const hasItems = items.some((c) => c);
  if (!hasItems) return null;
  return (
    <div className="space-y-2">
      <h2 className="text-xs font-bold uppercase tracking-wide opacity-60">{title}</h2>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

export default function AdminSearchPage() {
  return (
    <Suspense fallback={<p className="text-sm opacity-60">Loading…</p>}>
      <SearchResults />
    </Suspense>
  );
}
