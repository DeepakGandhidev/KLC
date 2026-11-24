"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { apiGet, apiSend, ApiError } from "@/lib/apiClient";
import { fmtDate, fmtKlc, fmtUsd } from "@/lib/format";
import type { TransactionApi, WalletData, WithdrawalApi } from "@/lib/types";
import { Icons } from "@/components/icons";
import {
  Card,
  Kicker,
  Spinner,
  StatusBadge,
  btnPrimary,
  btnSecondary,
  inputClass,
  tableClass,
  tableWrap,
  tdClass,
  thClass,
  theadClass,
} from "@/components/ui";

const FEE_RATE = 0.05;
const MIN_WITHDRAWAL = 10;
const TX_PAGE_SIZE = 15;

export default function WalletPage() {
  const { t, lang } = useLanguage();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalApi[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  async function fetchData(p: number) {
    const [w, wd] = await Promise.all([
      apiGet<WalletData>(`/api/wallet?page=${p}&limit=${TX_PAGE_SIZE}`),
      apiGet<{ withdrawals: WithdrawalApi[] }>("/api/withdrawals"),
    ]);
    return { wallet: w, withdrawals: wd.withdrawals };
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await fetchData(page);
        if (cancelled) return;
        setWallet(d.wallet);
        setWithdrawals(d.withdrawals);
      } catch {
        // AppShell owns the 401 redirect
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page]);

  const parsedAmount = Number(amount);
  const amountValid = Number.isFinite(parsedAmount) && parsedAmount > 0;
  const fee = amountValid ? round4(parsedAmount * FEE_RATE) : 0;
  const net = amountValid ? round4(parsedAmount - fee) : 0;

  function round4(n: number): number {
    return Math.round(n * 10000) / 10000;
  }

  async function submitWithdrawal(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);
    setSubmitting(true);
    try {
      await apiSend("/api/withdrawals", "POST", {
        amountKlc: parsedAmount,
        destination,
      });
      setAmount("");
      setDestination("");
      setFormSuccess(true);
      try {
        const d = await fetchData(page);
        setWallet(d.wallet);
        setWithdrawals(d.withdrawals);
      } catch {
        // keep the success state even if the refresh fails
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "insufficient_balance") setFormError("insufficient");
        else if (err.code === "amount_below_minimum" || err.code === "invalid_amount")
          setFormError("min");
        else setFormError("generic");
      } else {
        setFormError("generic");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading && !wallet) return <Spinner label={t("common.loading")} />;

  const pagination = wallet?.pagination;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <Kicker>{t("nav.wallet")}</Kicker>
        <h1 className="mt-2 text-3xl font-bold text-white">{t("wallet.title")}</h1>
        <p className="mt-2 text-slate-400">{t("wallet.subtitle")}</p>
      </header>

      {/* Balance hero */}
      <Card glow className="p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {t("wallet.balance")}
        </p>
        <p className="mt-3 bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-4xl font-extrabold text-transparent sm:text-5xl">
          {fmtKlc(wallet?.balance ?? 0)} KLC
        </p>
        <p className="mt-2 text-sm text-slate-400">
          ≈ {fmtUsd(wallet?.balance ?? 0, lang)} USD — {t("wallet.usdEquiv")}
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Withdrawal form */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-white">
            {t("wallet.withdraw.title")}
          </h2>
          <form onSubmit={submitWithdrawal} className="mt-5 space-y-4">
            <div>
              <label htmlFor="amount" className="mb-1.5 block text-sm font-medium text-slate-300">
                {t("wallet.withdraw.amount")}
              </label>
              <input
                id="amount"
                type="number"
                min={MIN_WITHDRAWAL}
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputClass}
              />
              <p className="mt-1.5 text-xs text-slate-500">
                {t("wallet.withdraw.min")}
              </p>
            </div>
            <div>
              <label htmlFor="destination" className="mb-1.5 block text-sm font-medium text-slate-300">
                {t("wallet.withdraw.destination")}
              </label>
              <input
                id="destination"
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className={inputClass}
              />
            </div>

            {amountValid && (
              <dl className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-400">{t("wallet.withdraw.fee")}</dt>
                  <dd className="font-semibold text-red-300">
                    −{fmtKlc(fee)} KLC
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">{t("wallet.withdraw.net")}</dt>
                  <dd className="font-semibold text-emerald-300">
                    {fmtKlc(net)} KLC
                  </dd>
                </div>
              </dl>
            )}

            {formError && (
              <p className="rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-2.5 text-sm text-red-300">
                {formError === "insufficient"
                  ? t("wallet.withdraw.insufficient")
                  : formError === "min"
                    ? t("wallet.withdraw.min")
                    : t("error.generic")}
              </p>
            )}
            {formSuccess && (
              <p className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-2.5 text-sm text-emerald-300">
                {t("wallet.withdraw.success")}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !amountValid || !destination}
              className={`${btnPrimary} w-full`}
            >
              {submitting ? t("common.loading") : t("wallet.withdraw.submit")}
            </button>
          </form>
        </Card>

        {/* Exchange + withdrawals */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-600 text-black">
                {Icons.exchange("h-5 w-5")}
              </span>
              <h2 className="text-lg font-bold text-white">
                {t("wallet.exchange.title")}
              </h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              {t("wallet.exchange.text")}
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold text-white">
              {t("wallet.withdrawals")}
            </h2>
            {withdrawals.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                {t("wallet.withdrawalsEmpty")}
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-white/5">
                {withdrawals.map((w) => (
                  <li key={w._id} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">
                        {fmtKlc(w.netKlc)} KLC{" "}
                        <span className="font-normal text-slate-500">
                          ({t("wallet.gross")} {fmtKlc(w.amountKlc)})
                        </span>
                      </p>
                      <StatusBadge status={w.status} />
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {w.destination} — {fmtDate(w.createdAt, lang)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Transactions */}
      <section>
        <h2 className="text-lg font-bold text-white">{t("wallet.transactions")}</h2>
        <div className={`mt-4 ${tableWrap}`}>
          <table className={tableClass}>
            <thead className={theadClass}>
              <tr>
                <th className={thClass}>{t("common.date")}</th>
                <th className={thClass}>{t("wallet.type")}</th>
                <th className={thClass}>{t("common.amount")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {!wallet || wallet.transactions.length === 0 ? (
                <tr>
                  <td className={`${tdClass} text-slate-500`} colSpan={3}>
                    {t("wallet.txEmpty")}
                  </td>
                </tr>
              ) : (
                wallet.transactions.map((tx: TransactionApi) => (
                  <tr key={tx._id} className="hover:bg-white/[0.03]">
                    <td className={tdClass}>{fmtDate(tx.createdAt, lang)}</td>
                    <td className={`${tdClass} font-medium text-white`}>
                      {t(`wallet.tx.${tx.type}`)}
                    </td>
                    <td
                      className={`${tdClass} font-bold ${
                        tx.amount >= 0 ? "text-emerald-300" : "text-red-300"
                      }`}
                    >
                      {tx.amount >= 0 ? "+" : "−"}
                      {fmtKlc(Math.abs(tx.amount))} KLC
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.pages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={btnSecondary}
            >
              {t("common.prev")}
            </button>
            <p className="text-sm text-slate-400">
              {t("wallet.pageOf", { page: pagination.page, pages: pagination.pages })}
            </p>
            <button
              type="button"
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
              className={btnSecondary}
            >
              {t("common.next")}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
