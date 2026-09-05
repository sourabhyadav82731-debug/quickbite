"use client";

import Link from "next/link";
import { UserRole } from "@quickbite/types";
import { PORTAL_ROLE_LABEL, PORTAL_PROFILE_ROUTE, Portal } from "./types";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Only ever shown to the already-authenticated owner of this data — name and
// role only, never email/phone/wallet/tokens.
export function QuickBiteProfileCard({
  portal,
  name,
  role,
}: {
  portal: Portal;
  name: string;
  role: UserRole;
}) {
  return (
    <Link href={PORTAL_PROFILE_ROUTE[portal]} className="qbnav-profile-card">
      <span className="qbnav-avatar" aria-hidden="true">
        {initials(name)}
      </span>
      <span className="qbnav-profile-text">
        <span className="qbnav-profile-name">{name}</span>
        <span className="qbnav-profile-role">{PORTAL_ROLE_LABEL[role]}</span>
      </span>
      <span className="qbnav-profile-chevron" aria-hidden="true">
        ›
      </span>
    </Link>
  );
}
