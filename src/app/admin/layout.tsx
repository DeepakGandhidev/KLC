"use client";

import type { ReactNode } from "react";
import { AppShell, type NavItem } from "@/components/AppShell";

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", labelKey: "admin.stats.title", icon: "overview", exact: true },
  { href: "/admin/users", labelKey: "admin.users.title", icon: "users" },
  { href: "/admin/withdrawals", labelKey: "admin.withdrawals.title", icon: "wallet" },
  { href: "/admin/memberships", labelKey: "admin.memberships.title", icon: "mining" },
  { href: "/dashboard", labelKey: "admin.backToDash", icon: "arrowRight", exact: true },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell items={NAV_ITEMS} requireAdmin>
      {children}
    </AppShell>
  );
}
