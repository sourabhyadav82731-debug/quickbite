"use client";

import Link from "next/link";
import { NavItemConfig } from "./types";

/** Shared premium 3D nav row — used by the desktop sidebar and the mobile
 *  "More" overflow sheet. Visual only: same href, same Link, same active-route
 *  detection contract as before (caller decides `active`). */
export function QuickBiteNavItem({
  item,
  active,
  onNavigate,
}: {
  item: NavItemConfig;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={`qbnav-item${active ? " qbnav-item-active" : ""}`}
    >
      <span className="qbnav-item-icon" aria-hidden="true">
        {item.icon}
      </span>
      <span className="qbnav-item-label">{item.label}</span>
    </Link>
  );
}
