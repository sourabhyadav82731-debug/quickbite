"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";
import { UserRole } from "@quickbite/types";
import { useAuth } from "@/lib/auth";
import { usePortalTheme } from "@/lib/use-portal-theme";
import { HelpAssistantWidget } from "@/components/help-assistant/HelpAssistantWidget";
import { QuickBiteSidebar } from "@/components/navigation/QuickBiteSidebar";
import { HamburgerButton } from "@/components/navigation/HamburgerButton";
import { NavItemConfig, Portal } from "@/components/navigation/types";
import { Skeleton } from "@/components/skeleton";

// Was previously enforced by middleware.ts reading a shared qb_role cookie —
// cookies apply to every tab of the origin, so one tab logging into a
// different role would flip the cookie and boot every other tab on refresh.
// This check instead reads this tab's own sessionStorage-backed auth state
// (via useAuth), which is genuinely per-tab, so each tab's role check is
// correct independent of what any other tab is doing.
const PORTAL_ROLES: Record<string, UserRole> = {
  customer: UserRole.CUSTOMER,
  restaurant: UserRole.RESTAURANT_OWNER,
  delivery: UserRole.DELIVERY_PARTNER,
  admin: UserRole.ADMIN,
};

export function PortalChrome({
  portal,
  title,
  navLinks,
  children,
  extraHeader,
  hideSidebar,
}: {
  portal: Portal;
  title: string;
  navLinks?: NavItemConfig[];
  children: ReactNode;
  extraHeader?: ReactNode;
  // When true, skips the shared left-side hamburger/sidebar entirely — the
  // caller is providing its own navigation (e.g. the driver portal's
  // right-side three-dot drawer) via extraHeader/children instead. Every
  // other portal keeps passing this as false/omitted and is completely
  // unaffected.
  hideSidebar?: boolean;
}) {
  const { user, loading, logout } = useAuth();
  const { mode, toggle } = usePortalTheme(portal);
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLDivElement>(null);

  const authorized = !loading && !!user && user.role === PORTAL_ROLES[portal];

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== PORTAL_ROLES[portal]) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, portal, pathname]);

  // Sidebar is a drawer now (closed by default at every breakpoint) — close
  // on Escape or on any click outside it, on top of the explicit close
  // button / backdrop click / nav-item click handled elsewhere.
  useEffect(() => {
    if (!sidebarOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSidebarOpen(false);
    }
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      // The hamburger button lives outside the sidebar's own DOM subtree (it
      // has to, to stay clickable above the drawer — see its fixed z-index
      // below) — exclude it here too, otherwise this handler and the
      // hamburger's own toggle race on the same click and can leave the
      // drawer open when the user meant to close it.
      const inSidebar = sidebarRef.current?.contains(target);
      const inHamburger = hamburgerRef.current?.contains(target);
      if (!inSidebar && !inHamburger) {
        setSidebarOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [sidebarOpen]);

  // A route change (nav-item click, browser back/forward, etc.) always
  // closes the drawer — never leaves it open over the new page.
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Renders nothing protected until this tab's own auth state confirms the
  // right role — avoids ever flashing another role's chrome/data mid-redirect.
  if (!authorized) {
    // No static sidebar column here anymore — the real layout has none
    // either now (it's a closed-by-default drawer), so the skeleton no
    // longer needs to reserve space for one.
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#1C0E13" }}>
        <div className="p-6 space-y-4" role="status" aria-label="Loading Quickbits">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-shell qbnav-shell flex flex-col min-h-screen" data-portal={portal} data-mode={mode}>
      {!hideSidebar && (
        <>
          <div ref={sidebarRef}>
            <QuickBiteSidebar
              portal={portal}
              title={title}
              navLinks={navLinks ?? []}
              userName={user!.name}
              userRole={user!.role}
              open={sidebarOpen}
              onNavigate={() => setSidebarOpen(false)}
            />
          </div>

          {/* Backdrop — dismissable, never a permanent block. Rendered at every
              breakpoint so "click outside closes" works consistently everywhere,
              per the brief. */}
          {sidebarOpen && (
            <div className="qbnav-backdrop" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
          )}

          {/* Deliberately its own fixed element, outside the topbar and outside
              the sidebar's own DOM subtree — the topbar's stacking context caps
              out below the sidebar's z-index, so a hamburger nested inside it
              would end up hidden behind the open drawer. Rendering it here, at
              the shell's top level with the highest z-index, keeps it visible
              and clickable at all times, exactly as "the button should remain
              visible" requires. */}
          <div ref={hamburgerRef} className="qbnav-hamburger-wrap">
            <HamburgerButton open={sidebarOpen} onClick={() => setSidebarOpen((v) => !v)} />
          </div>
        </>
      )}

      <div className="qbnav-page flex flex-col flex-1 min-w-0 min-h-screen">
        <header className="qbnav-topbar flex items-center justify-between">
          <Link href="/" className="qbnav-topbar-logo qbnav-topbar-logo-indent">
            {title}
          </Link>
          <div className="qbnav-topbar-controls">
            {extraHeader}
            <button onClick={toggle} className="qbnav-topbar-icon-btn" aria-label="Toggle theme">
              {mode === "light" ? "🌙" : "☀️"}
            </button>
            <button onClick={logout} className="qbnav-logout-btn">
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">{children}</main>
      </div>

      {/* The Helping Agent is the only floating element in its corner — the
          sidebar is a left-side drawer and never occupies or overlaps it. */}
      <HelpAssistantWidget portal={portal} />
    </div>
  );
}
