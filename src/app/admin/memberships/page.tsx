"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { apiGet } from "@/lib/apiClient";
import { fmtDate, fmtKlc, fmtUsd } from "@/lib/format";
import type { AdminMembership } from "@/lib/types";
import {
  Card,
  Kicker,
  Spinner,
  StatusBadge,
  tableClass,
  tdClass,
  thClass,
  theadClass,
} from "@/components/ui";

export default function AdminMembershipsPage() {
  const { t, lang } = useLanguage();
  const [memberships, setMemberships] = useState<AdminMembership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiGet<{ memberships: AdminMembership[] }>("/api/admin/memberships")
      .then((d) => {
        if (!cancelled) setMemberships(d.memberships);
      })
      .catch(() => {
        // AppShell owns the 401/403 redirect
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Spinner label={t("common.loading")} />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <Kicker>{t("admin.title")}</Kicker>
        <h1 className="mt-2 text-3xl font-bold text-white">
          {t("admin.memberships.title")}
        </h1>
      </header>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className={tableClass}>
            <thead className={theadClass}>
              <tr>
                <th className={thClass}>{t("admin.users.user")}</th>
                <th className={thClass}>{t("landing.plans.plan")}</th>
                <th className={thClass}>{t("plans.price")}</th>
                <th className={thClass}>{t("plans.daily")}</th>
                <th className={thClass}>{t("common.from")}</th>
                <th className={thClass}>{t("common.to")}</th>
                <th className={thClass}>{t("common.status")}</th>
                <th className={thClass}>{t("mining.totalMined")}</th>
                <th className={thClass}>{t("admin.memberships.renewal")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {memberships.length === 0 ? (
                <tr>
                  <td className={`${tdClass} text-slate-500`} colSpan={9}>
                    {t("common.none")}
                  </td>
                </tr>
              ) : (
                memberships.map((m) => (
                  <tr key={m._id} className="hover:bg-white/[0.03]">
                    <td className={tdClass}>
                      <p className="font-medium text-white">{m.user?.name ?? "—"}</p>
                      <p className="text-xs text-slate-500">{m.user?.email ?? ""}</p>
                    </td>
                    <td className={`${tdClass} font-semibold text-white`}>
                      {m.planName}
                    </td>
                    <td className={tdClass}>{fmtUsd(m.priceUsd, lang)} USD</td>
                    <td className={`${tdClass} text-amber-300`}>
                      {fmtKlc(m.dailyKlc)} KLC{t("common.perDay")}
                    </td>
                    <td className={tdClass}>{fmtDate(m.startDate, lang)}</td>
                    <td className={tdClass}>{fmtDate(m.endDate, lang)}</td>
                    <td className={tdClass}>
                      <StatusBadge status={m.status} />
                    </td>
                    <td className={`${tdClass} font-semibold text-emerald-300`}>
                      {fmtKlc(m.totalMined)}
                    </td>
                    <td className={tdClass}>
                      {m.isRenewal ? t("common.yes") : t("common.no")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
