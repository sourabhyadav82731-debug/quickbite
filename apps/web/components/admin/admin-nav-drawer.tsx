"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { api, apiClient, API_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function resolveUrl(url?: string | null) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_URL}${url}`;
}

interface DrawerItem {
  href: string;
  label: string;
  icon: string;
}

// Section 21's exact structure: ADMIN(Dashboard) -> OPERATIONS -> MANAGEMENT
// -> MARKETING -> FINANCE -> SUPPORT -> SYSTEM.
const ADMIN_HOME: DrawerItem = { href: "/admin", label: "Dashboard", icon: "📊" };

const OPERATIONS: DrawerItem[] = [
  { href: "/admin/orders", label: "All Orders", icon: "📦" },
  { href: "/admin/live-map", label: "Live Deliveries", icon: "🛰️" },
  { href: "/admin/returns", label: "Returns & Refunds", icon: "↩️" },
];

const MANAGEMENT: DrawerItem[] = [
  { href: "/admin/customers", label: "Customers", icon: "👥" },
  { href: "/admin/restaurants", label: "Restaurants", icon: "🏪" },
  { href: "/admin/drivers", label: "Drivers", icon: "🚴" },
  { href: "/admin/categories", label: "Categories", icon: "🍽️" },
  { href: "/admin/reviews", label: "Reviews", icon: "⭐" },
];

const MARKETING: DrawerItem[] = [
  { href: "/admin/coupons", label: "Coupons", icon: "🎟️" },
  { href: "/admin/offers", label: "Offers", icon: "🎁" },
];

const FINANCE: DrawerItem[] = [
  { href: "/admin/payments", label: "Payments", icon: "💳" },
  { href: "/admin/analytics", label: "Revenue Analytics", icon: "📈" },
  { href: "/admin/settlements/restaurants", label: "Restaurant Settlements", icon: "🏦" },
  { href: "/admin/settlements/drivers", label: "Driver Payouts", icon: "💰" },
  { href: "/admin/reports", label: "Financial Reports", icon: "🧾" },
];

const SUPPORT: DrawerItem[] = [
  { href: "/admin/support", label: "Support", icon: "🎧" },
];

const SYSTEM: DrawerItem[] = [
  { href: "/admin/notifications", label: "Notifications", icon: "🔔" },
  { href: "/admin/audit", label: "Admin Activity", icon: "📜" },
  { href: "/admin/settings", label: "Admin Profile & Security", icon: "🔐" },
];

export function AdminNavDrawer() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const drawerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/admin/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setOpen(false);
  }

  useEffect(() => setMounted(true), []);

  const { data: dashboard } = useQuery({
    queryKey: ["admin-drawer-dashboard"],
    queryFn: () => apiClient.get<any>("/admin/dashboard"),
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      const inDrawer = drawerRef.current?.contains(target);
      const inButton = buttonRef.current?.contains(target);
      if (!inDrawer && !inButton) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function Item({ item }: { item: DrawerItem }) {
    const isActive = pathname === item.href;
    return (
      <Link
        href={item.href}
        className={`qb-admin-drawer-item ${isActive ? "qb-admin-drawer-item-active" : ""}`}
        aria-current={isActive ? "page" : undefined}
      >
        <span aria-hidden="true">{item.icon}</span>
        <span>{item.label}</span>
      </Link>
    );
  }

  function Section({ title, items }: { title: string; items: DrawerItem[] }) {
    return (
      <nav aria-label={title}>
        <div className="qb-admin-drawer-section">
          <div className="qb-admin-drawer-section-title">{title}</div>
          <div className="space-y-1">
            {items.map((item) => (
              <Item key={item.href} item={item} />
            ))}
          </div>
        </div>
      </nav>
    );
  }

  const kpis = dashboard?.kpis;

  // Portaled to document.body for the same reason as the driver drawer: the
  // topbar's backdrop-filter establishes a containing block that would clip
  // a nested position:fixed drawer to the topbar's own thin strip.
  const drawerContent = (
    <>
      {open && <div className="qb-admin-drawer-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />}

      <div
        ref={drawerRef}
        className={`qb-admin-drawer ${open ? "qb-admin-drawer-open" : ""}`}
        aria-label="Admin navigation"
        aria-hidden={!open}
      >
        <div className="qb-admin-drawer-header space-y-3">
          <div className="flex items-center gap-3">
            {user?.avatarUrl ? (
              <img src={resolveUrl(user.avatarUrl) ?? ""} alt="" className="qb-admin-avatar" />
            ) : (
              <div className="qb-admin-avatar-fallback">{user?.name?.charAt(0)?.toUpperCase() ?? "A"}</div>
            )}
            <div className="min-w-0">
              <div className="font-bold truncate">{user?.name ?? "Admin"}</div>
              <div className="text-xs opacity-60">Admin Control Center</div>
            </div>
          </div>

          <form onSubmit={runSearch}>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search orders, customers, restaurants…"
              className="w-full glass-card px-3 py-2 text-xs"
            />
          </form>

          {kpis && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="qb-admin-badge qb-admin-badge-primary justify-center py-1.5">
                {kpis.onlineDrivers} drivers online
              </div>
              <div className="qb-admin-badge qb-admin-badge-info justify-center py-1.5">
                {kpis.activeOrders} live orders
              </div>
            </div>
          )}
        </div>

        <Section title="Admin" items={[ADMIN_HOME]} />
        <Section title="Operations" items={OPERATIONS} />
        <Section title="Management" items={MANAGEMENT} />
        <Section title="Marketing" items={MARKETING} />
        <Section title="Finance" items={FINANCE} />
        <Section title="Support" items={SUPPORT} />
        <Section title="System" items={SYSTEM} />

        <div className="qb-admin-drawer-footer space-y-2">
          <button onClick={logout} className="qb-admin-drawer-item w-full" style={{ color: "var(--qb-error)" }}>
            <span aria-hidden="true">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );

  // Portaled to document.body, same reasoning as the drawer itself: rendered
  // via extraHeader, the button would otherwise sit wherever the topbar's
  // flow places it and inherit its backdrop-filter containing block — this
  // keeps it a real fixed element pinned to the viewport's top-left corner.
  const buttonContent = (
    <div className="qb-admin-hamburger-wrap">
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className={`qb-admin-menu-btn${open ? " qb-admin-menu-btn-open" : ""}`}
        aria-label={open ? "Close admin navigation" : "Open admin navigation"}
        aria-expanded={open}
      >
        <span className="qb-admin-menu-btn-bar" />
        <span className="qb-admin-menu-btn-bar" />
        <span className="qb-admin-menu-btn-bar" />
      </button>
    </div>
  );

  return (
    <>
      {mounted && createPortal(buttonContent, document.body)}
      {mounted && createPortal(drawerContent, document.body)}
    </>
  );
}
