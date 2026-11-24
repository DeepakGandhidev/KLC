"use client";

import type { ReactNode } from "react";
import { AppShell, type NavItem } from "@/components/AppShell";

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", labelKey: "dash.overview.title", icon: "overview", exact: true },
  { href: "/dashboard/plans", labelKey: "nav.plans", icon: "plans" },
  { href: "/dashboard/mining", labelKey: "nav.mining", icon: "mining" },
  { href: "/dashboard/referrals", labelKey: "nav.referrals", icon: "users" },
  { href: "/dashboard/awards", labelKey: "nav.awards", icon: "trophy" },
  { href: "/dashboard/wallet", labelKey: "nav.wallet", icon: "wallet" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AppShell items={NAV_ITEMS}>{children}</AppShell>;
}
