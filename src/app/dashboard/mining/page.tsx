"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { apiGet } from "@/lib/apiClient";
import { fmtDate, fmtKlc } from "@/lib/format";
import type { MembershipApi, TransactionApi, WalletData } from "@/lib/types";
import {
  Card,
  EmptyState,
  Kicker,
  Spinner,
  StatusBadge,
  btnPrimary,
  tableClass,
  tableWrap,
  tdClass,
  thClass,
  theadClass,
} from "@/components/ui";

const DAY_MS = 24 * 60 * 60 * 1000;

export default function MiningPage() {
  const { t, lang } = useLanguage();
  const [memberships, setMemberships] = useState<MembershipApi[]>([]);
  const [miningTx, setMiningTx] = useState<TransactionApi[]>([]);
  const [totalMined, setTotalMined] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [m, w] = await Promise.all([
          apiGet<{ memberships: MembershipApi[] }>("/api/memberships"),
          apiGet<WalletData>("/api/wallet?page=1&limit=50"),
        ]);
        if (cancelled) return;
        setMemberships(m.memberships);
        setTotalMined(w.totalMined);
        setMiningTx(w.transactions.filter((tx) => tx.type === "mining"));
      } catch {
        // AppShell owns the 401 redirect
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Spinner label={t("common.loading")} />;

  const active = memberships.filter((m) => m.status === "active");
  const dailyRate = active.reduce((sum, m) => sum + m.dailyKlc, 0);

  const stats = [
    { label: t("mining.totalMined"), value: `${fmtKlc(totalMined)} KLC` },
    { label: t("mining.dailyRate"), value: `${fmtKlc(dailyRate)} KLC${t("common.perDay")}` },
    { label: t("mining.activeHubs"), value: String(active.length) },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <Kicker>{t("nav.mining")}</Kicker>
        <h1 className="mt-2 text-3xl font-bold text-white">{t("mining.title")}</h1>
        <p className="mt-2 text-slate-400">{t("mining.subtitle")}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {s.label}
            </p>
            <p className="mt-3 text-2xl font-extrabold text-white">{s.value}</p>
          </Card>
        ))}
      </div>

      <section>
        <h2 className="text-lg font-bold text-white">{t("mining.memberships")}</h2>
        {memberships.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              action={
                <Link href="/dashboard/plans" className={btnPrimary}>
                  {t("dash.overview.buyPlan")}
                </Link>
              }
            >
              {t("mining.empty")}
            </EmptyState>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {memberships.map((m) => {
              const totalDays = Math.max(
                1,
                Math.round(
                  (new Date(m.endDate).getTime() - new Date(m.startDate).getTime()) /
                    DAY_MS
                )
              );
              const potential = m.dailyKlc * totalDays;
              const pct = Math.min(
                100,
                potential > 0 ? (m.totalMined / potential) * 100 : 0
              );
              return (
                <Card key={m._id} className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-extrabold text-white">
                      {m.planName}
                    </h3>
                    <StatusBadge status={m.status} />
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t("mining.dailyRate")}</span>
                      <span className="font-semibold text-amber-300">
                        {fmtKlc(m.dailyKlc)} KLC{t("common.perDay")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t("common.from")}</span>
                      <span className="text-slate-200">{fmtDate(m.startDate, lang)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t("common.to")}</span>
                      <span className="text-slate-200">{fmtDate(m.endDate, lang)}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="uppercase tracking-wider text-slate-500">
                        {t("mining.progress")}
                      </span>
                      <span className="font-semibold text-slate-300">
                        {t("mining.minedOf", {
                          mined: fmtKlc(m.totalMined),
                          total: fmtKlc(potential),
                        })}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold text-white">{t("mining.history")}</h2>
        <div className={`mt-4 ${tableWrap}`}>
          <table className={tableClass}>
            <thead className={theadClass}>
              <tr>
                <th className={thClass}>{t("common.date")}</th>
                <th className={thClass}>{t("common.amount")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {miningTx.length === 0 ? (
                <tr>
                  <td className={`${tdClass} text-slate-500`} colSpan={2}>
                    {t("wallet.txEmpty")}
                  </td>
                </tr>
              ) : (
                miningTx.map((tx) => (
                  <tr key={tx._id}>
                    <td className={tdClass}>{fmtDate(tx.createdAt, lang)}</td>
                    <td className={`${tdClass} font-semibold text-emerald-300`}>
                      +{fmtKlc(tx.amount)} KLC
                    </td>
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
