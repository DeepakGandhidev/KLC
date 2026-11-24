"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { apiGet, apiSend } from "@/lib/apiClient";
import { fmtDate, fmtKlc } from "@/lib/format";
import type { AdminWithdrawal, WithdrawalStatus } from "@/lib/types";
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

type Filter = WithdrawalStatus | "all";
const FILTERS: Filter[] = ["pending", "approved", "rejected", "all"];

export default function AdminWithdrawalsPage() {
  const { t, lang } = useLanguage();
  const [filter, setFilter] = useState<Filter>("pending");
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function fetchWithdrawals(f: Filter) {
    const qs = f === "all" ? "" : `?status=${f}`;
    const d = await apiGet<{ withdrawals: AdminWithdrawal[] }>(
      `/api/admin/withdrawals${qs}`
    );
    return d.withdrawals;
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchWithdrawals(filter);
        if (!cancelled) setWithdrawals(list);
      } catch {
        // AppShell owns the 401/403 redirect
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filter]);

  async function process(id: string, action: "approve" | "reject") {
    if (action === "reject" && !window.confirm(t("admin.confirmReject"))) return;
    setBusyId(id);
    try {
      await apiSend(`/api/admin/withdrawals/${id}`, "PATCH", { action });
    } catch {
      // already_processed or transient error; the refresh below shows the truth
    }
    try {
      setWithdrawals(await fetchWithdrawals(filter));
    } catch {
      // keep the current list if the refresh fails
    }
    setBusyId(null);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <Kicker>{t("admin.title")}</Kicker>
        <h1 className="mt-2 text-3xl font-bold text-white">
          {t("admin.withdrawals.title")}
        </h1>
      </header>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => {
              setFilter(f);
              setLoading(true);
            }}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              filter === f
                ? "bg-amber-400/10 text-amber-300 ring-1 ring-inset ring-amber-400/30"
                : "border border-white/10 text-slate-300 hover:bg-white/5"
            }`}
          >
            {f === "all" ? t("common.all") : t(`common.${f}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner label={t("common.loading")} />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead className={theadClass}>
                <tr>
                  <th className={thClass}>{t("admin.users.user")}</th>
                  <th className={thClass}>{t("wallet.gross")}</th>
                  <th className={thClass}>{t("wallet.fee")}</th>
                  <th className={thClass}>{t("wallet.net")}</th>
                  <th className={thClass}>{t("wallet.destination")}</th>
                  <th className={thClass}>{t("common.date")}</th>
                  <th className={thClass}>{t("common.status")}</th>
                  <th className={thClass}>{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {withdrawals.length === 0 ? (
                  <tr>
                    <td className={`${tdClass} text-slate-500`} colSpan={8}>
                      {t("admin.withdrawals.empty")}
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w._id} className="hover:bg-white/[0.03]">
                      <td className={tdClass}>
                        <p className="font-medium text-white">
                          {w.user?.name ?? "—"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {w.user?.email ?? ""}
                        </p>
                      </td>
                      <td className={tdClass}>{fmtKlc(w.amountKlc)}</td>
                      <td className={`${tdClass} text-red-300`}>
                        {fmtKlc(w.feeKlc)}
                      </td>
                      <td className={`${tdClass} font-semibold text-emerald-300`}>
                        {fmtKlc(w.netKlc)}
                      </td>
                      <td className={`${tdClass} max-w-[180px] truncate`}>
                        {w.destination}
                      </td>
                      <td className={tdClass}>{fmtDate(w.createdAt, lang)}</td>
                      <td className={tdClass}>
                        <StatusBadge status={w.status} />
                      </td>
                      <td className={tdClass}>
                        {w.status === "pending" ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={busyId === w._id}
                              onClick={() => process(w._id, "approve")}
                              className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/20 disabled:opacity-50"
                            >
                              {t("admin.withdrawals.approve")}
                            </button>
                            <button
                              type="button"
                              disabled={busyId === w._id}
                              onClick={() => process(w._id, "reject")}
                              className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-400/20 disabled:opacity-50"
                            >
                              {t("admin.withdrawals.reject")}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">
                            {t("admin.withdrawals.processed")}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
