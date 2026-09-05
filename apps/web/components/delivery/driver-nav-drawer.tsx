"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiClient, API_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function resolveUrl(url?: string | null) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_URL}${url}`;
}

const STAGE_LABEL: Record<string, string> = {
  ASSIGNED: "Heading to restaurant",
  ARRIVED_AT_RESTAURANT: "At restaurant",
  PICKED_UP: "Picked up",
  OUT_FOR_DELIVERY: "Out for delivery",
  ARRIVED_AT_CUSTOMER: "At customer",
};

interface DrawerItem {
  href: string;
  label: string;
  icon: string;
}

const OPERATIONS: DrawerItem[] = [
  { href: "/delivery", label: "Dashboard", icon: "🏠" },
  { href: "/delivery/history", label: "Orders History", icon: "📦" },
  { href: "/delivery/map", label: "Demand Heat Map", icon: "🔥" },
];

const FINANCE: DrawerItem[] = [
  { href: "/delivery/earnings", label: "Earnings Summary", icon: "💰" },
  { href: "/delivery/incentives", label: "Incentives & Bonuses", icon: "🎁" },
  { href: "/delivery/payouts", label: "Payouts & Wallet", icon: "💳" },
];

const SUPPORT: DrawerItem[] = [
  { href: "/delivery/performance", label: "Performance & Rating", icon: "⭐" },
  { href: "/delivery/safety", label: "Safety & SOS", icon: "🛡" },
  { href: "/delivery/profile", label: "Profile & Documents", icon: "👤" },
];

export function DriverNavDrawer() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // The drawer/backdrop portal to document.body (see below) — only after
  // mount, so server-rendered HTML never tries to reference `document`.
  useEffect(() => setMounted(true), []);

  const { data: profile } = useQuery({
    queryKey: ["driver-me"],
    queryFn: () => apiClient.get<any>("/drivers/me"),
    refetchInterval: 15000,
  });
  const { data: activeList } = useQuery({
    queryKey: ["driver-active"],
    queryFn: () => apiClient.get<any[]>("/deliveries/active"),
    refetchInterval: 15000,
  });

  const p = profile as any;
  const active = ((activeList as any[]) ?? [])[0];
  const isOnline = !!p?.isOnline;

  async function toggleDuty() {
    if (!p) return;
    await api.delivery.goOnline(!isOnline);
    qc.invalidateQueries({ queryKey: ["driver-me"] });
  }

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
        className={`qb-driver-drawer-item ${isActive ? "qb-driver-drawer-item-active" : ""}`}
        aria-current={isActive ? "page" : undefined}
      >
        <span aria-hidden="true">{item.icon}</span>
        <span>{item.label}</span>
      </Link>
    );
  }

  // Portaled straight to document.body — .qbnav-topbar (this button's actual
  // DOM parent, via extraHeader) uses backdrop-filter, which establishes a
  // new containing block for any position:fixed descendant. Left nested
  // in place, the drawer/backdrop would be clipped to the topbar's own
  // thin strip instead of covering the viewport. The trigger button itself
  // isn't fixed, so it stays right where extraHeader puts it.
  const drawerContent = (
    <>
      {open && <div className="qb-driver-drawer-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />}

      <div
        ref={drawerRef}
        className={`qb-driver-drawer ${open ? "qb-driver-drawer-open" : ""}`}
        aria-label="Driver navigation"
        aria-hidden={!open}
      >
        <div className="qb-driver-drawer-header space-y-3">
          <div className="flex items-center gap-3">
            {user?.avatarUrl ? (
              <img src={resolveUrl(user.avatarUrl) ?? ""} alt="" className="qb-driver-avatar" />
            ) : (
              <div className="qb-driver-avatar-fallback">{user?.name?.charAt(0)?.toUpperCase() ?? "D"}</div>
            )}
            <div className="min-w-0">
              <div className="font-bold truncate">{user?.name ?? "Driver"}</div>
              <div className="text-xs opacity-60">Driver ID: {p?.id ? p.id.slice(0, 8).toUpperCase() : "—"}</div>
            </div>
          </div>

          <button
            onClick={toggleDuty}
            className={`qb-duty-toggle ${isOnline ? "qb-duty-toggle-on" : "qb-duty-toggle-off"}`}
            role="switch"
            aria-checked={isOnline}
            disabled={!p}
          >
            <span className={`qb-duty-dot ${isOnline ? "qb-duty-dot-on" : "qb-duty-dot-off"}`} aria-hidden="true" />
            <span className="flex-1 text-left">
              <div className="text-sm font-bold">{isOnline ? "ON DUTY" : "OFF DUTY"}</div>
              <div className="text-[11px] opacity-70">
                {isOnline ? "You're available for deliveries" : "You're currently offline"}
              </div>
            </span>
          </button>
        </div>

        <nav aria-label="Operations">
          <div className="qb-driver-drawer-section">
            <div className="qb-driver-drawer-section-title">Operations</div>
            <div className="space-y-1">
              {active && (
                <div className="qb-driver-active-highlight p-1 mb-1.5">
                  <Link
                    href="/delivery/active"
                    className={`qb-driver-drawer-item ${pathname === "/delivery/active" ? "qb-driver-drawer-item-active" : ""}`}
                  >
                    <span aria-hidden="true">🚴</span>
                    <span className="flex-1 min-w-0">
                      <div className="font-semibold">ACTIVE DELIVERY</div>
                      <div className="text-[11px] opacity-70 truncate">
                        #{active.orderId?.slice(0, 8)} · {active.restaurantName ?? "Restaurant"} ·{" "}
                        {STAGE_LABEL[active.stage] ?? active.stage}
                      </div>
                    </span>
                  </Link>
                </div>
              )}
              {OPERATIONS.map((item) => (
                <Item key={item.href} item={item} />
              ))}
            </div>
          </div>
        </nav>

        <nav aria-label="Earnings and finance">
          <div className="qb-driver-drawer-section">
            <div className="qb-driver-drawer-section-title">Earnings &amp; Finance</div>
            <div className="space-y-1">
              {FINANCE.map((item) => (
                <Item key={item.href} item={item} />
              ))}
            </div>
          </div>
        </nav>

        <nav aria-label="Other and support">
          <div className="qb-driver-drawer-section">
            <div className="qb-driver-drawer-section-title">Other &amp; Support</div>
            <div className="space-y-1">
              {SUPPORT.map((item) => (
                <Item key={item.href} item={item} />
              ))}
            </div>
          </div>
        </nav>

        <div className="qb-driver-drawer-footer space-y-2">
          <p className="text-[11px] opacity-60 text-center">
            Need help? Tap the Quickbits assistant button in the corner anytime.
          </p>
          <button onClick={logout} className="qb-driver-drawer-item w-full" style={{ color: "var(--qb-error)" }}>
            <span aria-hidden="true">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className="qb-driver-menu-btn"
        aria-label="Open driver navigation"
        aria-expanded={open}
      >
        ⋮
      </button>
      {mounted && createPortal(drawerContent, document.body)}
    </>
  );
}
