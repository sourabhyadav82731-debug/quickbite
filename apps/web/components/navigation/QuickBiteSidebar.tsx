"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { UserRole } from "@quickbite/types";
import { QuickBiteNavItem } from "./QuickBiteNavItem";
import { QuickBiteProfileCard } from "./QuickBiteProfileCard";
import { NavItemConfig, Portal } from "./types";

export function QuickBiteSidebar({
  portal,
  title,
  navLinks,
  userName,
  userRole,
  open,
  onNavigate,
}: {
  portal: Portal;
  title: string;
  navLinks: NavItemConfig[];
  userName: string;
  userRole: UserRole;
  open: boolean;
  onNavigate: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={`qbnav-sidebar${open ? " qbnav-sidebar-open" : ""}`}
      aria-label="Primary navigation"
      aria-hidden={!open}
    >
      <Link href="/" className="qbnav-logo" onClick={onNavigate}>
        {title}
      </Link>

      <nav className="qbnav-list" aria-label={`${portal} navigation`}>
        {navLinks.map((item) => (
          <QuickBiteNavItem
            key={item.href}
            item={item}
            active={pathname === item.href}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="qbnav-sidebar-footer">
        <div className="qbnav-divider" />
        <QuickBiteProfileCard portal={portal} name={userName} role={userRole} />
      </div>
    </aside>
  );
}
