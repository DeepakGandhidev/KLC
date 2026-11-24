"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionaries";
import { apiGet, apiSend } from "@/lib/apiClient";
import { fmtKlc } from "@/lib/format";
import type { PublicUser } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Icons, type IconName } from "@/components/icons";
import { Spinner } from "@/components/ui";

export interface NavItem {
  href: string;
  labelKey: DictKey;
  icon: IconName;
  exact?: boolean;
}

export function AppShell({
  items,
  requireAdmin = false,
  children,
}: {
  items: NavItem[];
  requireAdmin?: boolean;
  children: ReactNode;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [denied, setDenied] = useState(false);
  const [credited, setCredited] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiGet<{ user: PublicUser; miningCredited: number }>(
          "/api/auth/me"
        );
        if (cancelled) return;
        if (requireAdmin && data.user.role !== "admin") {
          setDenied(true);
          router.replace("/dashboard");
          return;
        }
        setUser(data.user);
        if (data.miningCredited > 0) {
          setCredited(data.miningCredited);
          setToastVisible(true);
        }
      } catch {
        if (cancelled) return;
        router.replace("/login");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [requireAdmin, router]);

  const logout = useCallback(async () => {
    try {
      await apiSend("/api/auth/logout", "POST");
    } catch {
      // session may already be gone; redirect regardless
    }
    router.push("/");
  }, [router]);

  if (!user || denied) {
    return (
      <div className="flex min-h-screen flex-1 flex-col">
        <Spinner label={t("common.loading")} />
      </div>
    );
  }

  const allItems: NavItem[] =
    !requireAdmin && user.role === "admin"
      ? [...items, { href: "/admin", labelKey: "nav.admin", icon: "shield", exact: true }]
      : items;

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const navLink = (item: NavItem, mobile = false) => {
    const active = isActive(item);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          mobile ? "shrink-0 whitespace-nowrap" : ""
        } ${
          active
            ? "bg-amber-400/10 text-amber-300 ring-1 ring-inset ring-amber-400/30"
            : "text-slate-300 hover:bg-white/5 hover:text-white"
        }`}
      >
        {Icons[item.icon]("h-5 w-5 shrink-0")}
        <span>{t(item.labelKey)}</span>
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen flex-1">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-[#0a0f1c] px-4 py-6 lg:flex">
        <div className="px-2">
          <Logo />
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {allItems.map((item) => navLink(item))}
        </nav>
        <div className="mt-6 space-y-4 border-t border-white/10 pt-4">
          <LanguageToggle />
          <div className="rounded-xl bg-white/5 px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="truncate text-xs text-slate-400">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-red-500/10 hover:text-red-300"
          >
            {Icons.logout("h-5 w-5")}
            <span>{t("common.logout")}</span>
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex min-h-screen flex-1 flex-col lg:hidden">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0f1c]/95 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <Logo />
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <button
                type="button"
                onClick={logout}
                aria-label={t("common.logout")}
                className="rounded-xl border border-white/15 p-2 text-slate-300 transition hover:bg-red-500/10 hover:text-red-300"
              >
                {Icons.logout("h-5 w-5")}
              </button>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-3">
            {allItems.map((item) => navLink(item, true))}
          </nav>
        </header>
        <main className="flex-1 px-4 py-6">
          {toastVisible && (
            <MiningToast n={credited} onClose={() => setToastVisible(false)} />
          )}
          {children}
        </main>
      </div>

      {/* Desktop main */}
      <main className="hidden min-w-0 flex-1 px-8 py-8 lg:block">
        {toastVisible && (
          <MiningToast n={credited} onClose={() => setToastVisible(false)} />
        )}
        {children}
      </main>
    </div>
  );
}

function MiningToast({ n, onClose }: { n: number; onClose: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200 shadow-[0_0_40px_-16px_rgba(52,211,153,0.5)]">
      <span className="flex items-center gap-2">
        {Icons.spark("h-4 w-4 text-emerald-300")}
        {t("dash.overview.miningCredited", { n: fmtKlc(n) })}
      </span>
      <button
        type="button"
        onClick={onClose}
        aria-label={t("common.close")}
        className="rounded-lg p-1 text-emerald-200/70 transition hover:bg-emerald-400/10 hover:text-emerald-100"
      >
        {Icons.close("h-4 w-4")}
      </button>
    </div>
  );
}
