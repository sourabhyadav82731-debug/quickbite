"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { usePortalTheme } from "@/lib/use-portal-theme";

interface NavLink {
  href: string;
  label: string;
}

export function PortalChrome({
  portal,
  title,
  navLinks,
  children,
  extraHeader,
}: {
  portal: "customer" | "restaurant" | "delivery" | "admin";
  title: string;
  navLinks: NavLink[];
  children: ReactNode;
  extraHeader?: ReactNode;
}) {
  const { user, logout } = useAuth();
  const { mode, toggle } = usePortalTheme(portal);
  const pathname = usePathname();

  return (
    <div className="portal-shell flex flex-col min-h-screen" data-portal={portal} data-mode={mode}>
      <header
        className="sticky top-0 z-20 border-b backdrop-blur-xl"
        style={{ borderColor: "var(--portal-border)", background: "var(--portal-card)" }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-bold" style={{ color: "var(--portal-primary)" }}>
              {title}
            </Link>
            <nav className="hidden md:flex items-center gap-1 text-sm">
              {navLinks.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-3 py-1.5 rounded-lg transition-colors"
                    style={{
                      background: active ? "var(--portal-primary)" : "transparent",
                      color: active ? "white" : "var(--portal-fg)",
                      opacity: active ? 1 : 0.75,
                    }}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {extraHeader}
            <button
              onClick={toggle}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "var(--portal-border)" }}
              aria-label="Toggle theme"
            >
              {mode === "light" ? "🌙" : "☀️"}
            </button>
            <span className="opacity-70 hidden sm:inline">{user?.name}</span>
            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-lg text-white text-xs font-medium"
              style={{ background: "var(--portal-primary)" }}
            >
              Logout
            </button>
          </div>
        </div>
        <nav className="md:hidden flex items-center gap-1 text-xs px-4 pb-2 overflow-x-auto">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 rounded-lg whitespace-nowrap"
              style={{
                background: pathname === link.href ? "var(--portal-primary)" : "var(--portal-border)",
                color: pathname === link.href ? "white" : "var(--portal-fg)",
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
