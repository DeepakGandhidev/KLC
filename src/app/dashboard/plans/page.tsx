"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { apiGet, apiSend, ApiError } from "@/lib/apiClient";
import { fmtKlc, fmtUsd } from "@/lib/format";
import type { MembershipApi, PlanApi } from "@/lib/types";
import { Icons } from "@/components/icons";
import {
  Badge,
  Card,
  Kicker,
  Spinner,
  btnPrimary,
  btnSecondary,
} from "@/components/ui";

export default function PlansPage() {
  const { t, lang } = useLanguage();
  const [plans, setPlans] = useState<PlanApi[]>([]);
  const [memberships, setMemberships] = useState<MembershipApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PlanApi | null>(null);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function fetchData() {
    const [p, m] = await Promise.all([
      apiGet<{ plans: PlanApi[] }>("/api/plans"),
      apiGet<{ memberships: MembershipApi[] }>("/api/memberships"),
    ]);
    return { plans: p.plans, memberships: m.memberships };
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await fetchData();
        if (cancelled) return;
        setPlans(d.plans);
        setMemberships(d.memberships);
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

  const activePlanIds = new Set(
    memberships.filter((m) => m.status === "active").map((m) => m.plan)
  );

  async function confirmBuy() {
    if (!selected) return;
    setBuying(true);
    setError(null);
    try {
      await apiSend("/api/memberships", "POST", { planSlug: selected.slug });
      setSelected(null);
      setSuccess(true);
      try {
        const d = await fetchData();
        setPlans(d.plans);
        setMemberships(d.memberships);
      } catch {
        // keep the success state even if the refresh fails
      }
    } catch (e) {
      setError(
        e instanceof ApiError && e.code === "plan_not_found"
          ? t("error.planNotFound")
          : t("error.generic")
      );
    } finally {
      setBuying(false);
    }
  }

  if (loading) return <Spinner label={t("common.loading")} />;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <Kicker>{t("nav.plans")}</Kicker>
        <h1 className="mt-2 text-3xl font-bold text-white">{t("plans.title")}</h1>
        <p className="mt-2 text-slate-400">{t("plans.subtitle")}</p>
      </header>

      {success && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          {Icons.check("h-4 w-4 text-emerald-300")}
          {t("plans.purchased")}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {plans.map((p) => {
          const isActive = activePlanIds.has(p._id);
          const totalPotential = p.dailyKlc * p.durationMonths * 30;
          const popular = p.slug === "gold";
          return (
            <Card
              key={p._id}
              glow={popular}
              className="flex flex-col p-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-white">{p.name}</h2>
                <div className="flex gap-2">
                  {isActive && <Badge tone="emerald">{t("plans.activeTag")}</Badge>}
                  {popular && !isActive && (
                    <Badge tone="amber">{t("landing.plans.popular")}</Badge>
                  )}
                </div>
              </div>

              <p className="mt-4">
                <span className="text-3xl font-extrabold text-white">
                  {fmtUsd(p.priceUsd, lang)}
                </span>{" "}
                <span className="text-sm text-slate-400">USD</span>
              </p>

              <dl className="mt-5 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-400">{t("plans.duration")}</dt>
                  <dd className="font-semibold text-white">
                    {p.durationMonths} {t("common.months")}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">{t("plans.daily")}</dt>
                  <dd className="font-semibold text-amber-300">
                    {fmtKlc(p.dailyKlc)} KLC{t("common.perDay")}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">{t("plans.totalReturn")}</dt>
                  <dd className="font-semibold text-white">
                    {fmtKlc(totalPotential)} KLC
                  </dd>
                </div>
                <div className="border-t border-white/5 pt-2.5">
                  <dt className="mb-1.5 text-slate-400">{t("plans.referralRates")}</dt>
                  <dd className="flex gap-2 text-xs">
                    {(["g1", "g2", "g3"] as const).map((g) => (
                      <span
                        key={g}
                        className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 font-semibold text-slate-200"
                      >
                        {g.toUpperCase()} {p.referralRates[g]}%
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>

              <button
                type="button"
                onClick={() => {
                  setSelected(p);
                  setError(null);
                }}
                className={`${popular ? btnPrimary : btnSecondary} mt-6 w-full`}
              >
                {t("plans.buy")}
              </button>
            </Card>
          );
        })}
      </div>

      {/* Confirm modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => !buying && setSelected(null)}
        >
          <Card
            glow
            className="w-full max-w-md bg-[#0a0f1c] p-6"
            // stop propagation so clicks inside don't close
          >
            <div onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-white">
                {t("plans.buyConfirm.title")}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                {t("plans.buyConfirm.text", {
                  plan: selected.name,
                  price: fmtUsd(selected.priceUsd, lang),
                  daily: fmtKlc(selected.dailyKlc),
                  months: selected.durationMonths,
                })}
              </p>
              {error && (
                <p className="mt-4 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-2.5 text-sm text-red-300">
                  {error}
                </p>
              )}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  disabled={buying}
                  className={`${btnSecondary} flex-1`}
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={confirmBuy}
                  disabled={buying}
                  className={`${btnPrimary} flex-1`}
                >
                  {buying ? t("common.loading") : t("plans.buyConfirm.confirm")}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
