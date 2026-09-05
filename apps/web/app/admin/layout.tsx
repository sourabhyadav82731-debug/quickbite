"use client";

import { ReactNode } from "react";
import { PortalChrome } from "@/components/portal-chrome";
import { AdminNavDrawer } from "@/components/admin/admin-nav-drawer";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <PortalChrome portal="admin" title="👑 Quickbits Admin" hideSidebar extraHeader={<AdminNavDrawer />}>
      {children}
    </PortalChrome>
  );
}
