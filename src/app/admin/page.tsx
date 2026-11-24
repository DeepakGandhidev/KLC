"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { apiGet } from "@/lib/apiClient";
import { fmtDate, fmtKlc, fmtUsd } from "@/lib/format";
import type { AdminStats, AdminUser } from "@/lib/types";
import { Icons } from "@/components/icons";
import {
  Card,
  Kicker,
  Spinner,
  tableClass,
  tableWrap,
  tdClass,
  thClass,
  theadClass,
} from "@/components/ui";

export default function AdminStatsPage() {
  const { t, lang } = useLanguage();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, u] = await Promise.all([
          apiGet<AdminStats>("/api/admin/stats"),
          apiGet<{ users: AdminUser[] }>("/api/admin/users"),
        ]);
        if (cancelled) return;
        setStats(s);
        setUsers(u.users.slice(0, 8));
      } catch {
        // AppShell owns the 401/403 redirect
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Spinner label={t("common.loading")} />;

  const cards = [
    {
      label: t("admin.stats.users"),
      value: fmtUsd(stats?.users ?? 0, lang),
      icon: "users" as const,
    },
    {
      label: t("admin.stats.memberships"),
      value: fmtUsd(stats?.activeMemberships ?? 0, lang),
      icon: "mining" as const,
    },
    {
      label: t("admin.stats.volume"),
      value: `${fmtUsd(stats?.totalVolumeUsd ?? 0, lang)} USD`,
      icon: "plans" as const,
    },
    {
      label: t("admin.stats.klcDistributed"),
      value: `${fmtKlc(stats?.klcDistributed ?? 0)} KLC`,
      icon: "spark" as const,
    },
    {
      label: t("admin.stats.pendingWithdrawals"),
      value: fmtUsd(stats?.pendingWithdrawals ?? 0, lang),
      icon: "wallet" as const,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <Kicker>{t("admin.title")}</Kicker>
        <h1 className="mt-2 text-3xl font-bold text-white">
          {t("admin.stats.title")}
        </h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((c) => (
          <Card key={c.label} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {c.label}
              </p>
              <span className="text-amber-400/70">{Icons[c.icon]("h-5 w-5")}</span>
            </div>
            <p className="mt-3 text-xl font-extrabold text-white">{c.value}</p>
          </Card>
        ))}
      </div>

      <section>
        <h2 className="text-lg font-bold text-white">{t("admin.recentUsers")}</h2>
        <div className={`mt-4 ${tableWrap}`}>
          <table className={tableClass}>
            <thead className={theadClass}>
              <tr>
                <th className={thClass}>{t("admin.users.user")}</th>
                <th className={thClass}>{t("common.email")}</th>
                <th className={thClass}>{t("admin.users.joined")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.length === 0 ? (
                <tr>
                  <td className={`${tdClass} text-slate-500`} colSpan={3}>
                    {t("admin.users.empty")}
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-white/[0.03]">
                    <td className={`${tdClass} font-medium text-white`}>{u.name}</td>
                    <td className={tdClass}>{u.email}</td>
                    <td className={tdClass}>{fmtDate(u.createdAt, lang)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
