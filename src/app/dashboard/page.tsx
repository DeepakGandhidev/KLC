"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { apiGet } from "@/lib/apiClient";
import { fmtDate, fmtKlc, fmtUsd } from "@/lib/format";
import type {
  MembershipApi,
  PublicUser,
  ReferralsData,
  TransactionApi,
  WalletData,
} from "@/lib/types";
import { Icons } from "@/components/icons";
import { Card, Kicker, Spinner, btnPrimary, btnSecondary } from "@/components/ui";

export default function DashboardOverviewPage() {
  const { t, lang } = useLanguage();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [memberships, setMemberships] = useState<MembershipApi[]>([]);
  const [referrals, setReferrals] = useState<ReferralsData | null>(null);
  const [transactions, setTransactions] = useState<TransactionApi[]>([]);
  const [planProgress, setPlanProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [me, m, r, w] = await Promise.all([
          apiGet<{ user: PublicUser; miningCredited: number }>("/api/auth/me"),
          apiGet<{ memberships: MembershipApi[] }>("/api/memberships"),
          apiGet<ReferralsData>("/api/referrals"),
          apiGet<WalletData>("/api/wallet?page=1&limit=8"),
        ]);
        if (cancelled) return;
        setUser(me.user);
        setMemberships(m.memberships);
        setReferrals(r);
        setTransactions(w.transactions);
        const ap = m.memberships.find((x) => x.status === "active");
        if (ap) {
          const start = new Date(ap.startDate).getTime();
          const end = new Date(ap.endDate).getTime();
          const elapsed = ((Date.now() - start) / (end - start)) * 100;
          setPlanProgress(Math.min(100, Math.max(0, elapsed)));
        }
      } catch {
        // AppShell owns the 401 redirect; nothing to do here
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !user) return <Spinner label={t("common.loading")} />;

  const activePlan = memberships.find((m) => m.status === "active") ?? null;
  const progress = planProgress;

  const stats = [
    {
      label: t("dash.overview.balance"),
      value: `${fmtKlc(user.klcBalance)} KLC`,
      sub: t("dash.overview.balanceUsd", { n: fmtUsd(user.klcBalance, lang) }),
      icon: "wallet" as const,
    },
    {
      label: t("dash.overview.totalMined"),
      value: `${fmtKlc(user.totalMined)} KLC`,
      icon: "mining" as const,
    },
    {
      label: t("dash.overview.referralEarnings"),
      value: `${fmtKlc(user.totalReferralEarnings)} KLC`,
      icon: "users" as const,
    },
    {
      label: t("dash.overview.bonus"),
      value: `${fmtKlc(user.totalBonus)} KLC`,
      icon: "gift" as const,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <Kicker>{t("dash.overview.title")}</Kicker>
        <h1 className="mt-2 text-3xl font-bold text-white">
          {t("dash.overview.welcome")}, {user.name}
        </h1>
      </header>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {s.label}
              </p>
              <span className="text-amber-400/70">{Icons[s.icon]("h-5 w-5")}</span>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-white">{s.value}</p>
            {s.sub && <p className="mt-1 text-xs text-slate-500">{s.sub}</p>}
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active plan */}
        {activePlan ? (
          <Card glow className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {t("dash.overview.activePlan")}
              </p>
              <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                {t("common.active")}
              </span>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-white">
              {activePlan.planName}
            </p>
            <p className="mt-1 text-sm text-amber-300">
              {t("dash.overview.dailyRate")} : {fmtKlc(activePlan.dailyKlc)} KLC
              {t("common.perDay")}
            </p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-slate-400">
              {t("dash.overview.expiresOn")} : {fmtDate(activePlan.endDate, lang)}
            </p>
          </Card>
        ) : (
          <Card className="flex flex-col items-start justify-between gap-4 p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {t("dash.overview.activePlan")}
              </p>
              <p className="mt-3 text-xl font-bold text-white">
                {t("dash.overview.noPlan")}
              </p>
            </div>
            <Link href="/dashboard/plans" className={btnPrimary}>
              {t("dash.overview.buyPlan")}
              {Icons.arrowRight("h-4 w-4")}
            </Link>
          </Card>
        )}

        {/* Team */}
        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {t("dash.overview.team")}
          </p>
          <p className="mt-3 text-2xl font-extrabold text-white">
            {referrals?.counts.g1 ?? 0}{" "}
            <span className="text-base font-semibold text-slate-400">
              {t("dash.overview.directRefs")}
            </span>
          </p>
          <div className="mt-4 flex gap-3">
            {(["g1", "g2", "g3"] as const).map((g) => (
              <div
                key={g}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-center"
              >
                <p className="text-lg font-bold text-amber-300">
                  {referrals?.counts[g] ?? 0}
                </p>
                <p className="text-[11px] uppercase tracking-wider text-slate-500">
                  {g.toUpperCase()}
                </p>
              </div>
            ))}
          </div>
          <Link
            href="/dashboard/referrals"
            className={`${btnSecondary} mt-4 w-full`}
          >
            {t("dash.overview.invite")}
          </Link>
        </Card>
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {t("dash.overview.quickActions")}
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href="/dashboard/plans" className={btnPrimary}>
            {Icons.plans("h-4 w-4")}
            {t("dash.overview.buyPlan")}
          </Link>
          <Link href="/dashboard/wallet" className={btnSecondary}>
            {Icons.wallet("h-4 w-4")}
            {t("dash.overview.withdraw")}
          </Link>
          <Link href="/dashboard/referrals" className={btnSecondary}>
            {Icons.users("h-4 w-4")}
            {t("dash.overview.invite")}
          </Link>
        </div>
      </div>

      {/* Recent transactions */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {t("dash.overview.recentTx")}
          </p>
          <Link
            href="/dashboard/wallet"
            className="text-xs font-semibold text-amber-300 hover:text-amber-200"
          >
            {t("common.viewAll")}
          </Link>
        </div>
        {transactions.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">{t("dash.overview.noTx")}</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/5">
            {transactions.map((tx) => (
              <li key={tx._id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {t(`wallet.tx.${tx.type}`)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {fmtDate(tx.createdAt, lang)}
                  </p>
                </div>
                <p
                  className={`shrink-0 text-sm font-bold ${
                    tx.amount >= 0 ? "text-emerald-300" : "text-red-300"
                  }`}
                >
                  {tx.amount >= 0 ? "+" : "−"}
                  {fmtKlc(Math.abs(tx.amount))} KLC
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
