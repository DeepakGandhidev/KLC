"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { apiGet } from "@/lib/apiClient";
import { fmtKlc } from "@/lib/format";
import type { AwardTierApi } from "@/lib/types";
import { Badge, Card, Kicker, Spinner } from "@/components/ui";

export default function AwardsPage() {
  const { t } = useLanguage();
  const [tiers, setTiers] = useState<AwardTierApi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiGet<{ tiers: AwardTierApi[] }>("/api/awards")
      .then((d) => {
        if (!cancelled) setTiers(d.tiers);
      })
      .catch(() => {
        // AppShell owns the 401 redirect
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
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <Kicker>{t("nav.awards")}</Kicker>
        <h1 className="mt-2 text-3xl font-bold text-white">{t("awards.title")}</h1>
        <p className="mt-2 max-w-2xl text-slate-400">{t("awards.subtitle")}</p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {tiers.map((tier) => {
          const pct = Math.min(
            100,
            tier.people > 0 ? (tier.progress / tier.people) * 100 : 0
          );
          return (
            <Card key={tier.rank} glow={tier.achieved} className="p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg font-extrabold text-white">
                  <span className="h-3 w-3 rotate-45 rounded-[3px] bg-gradient-to-br from-amber-300 to-amber-600" />
                  {tier.rank}
                </h2>
                {tier.achieved ? (
                  <Badge tone="emerald">{t("awards.achieved")}</Badge>
                ) : (
                  <Badge tone="amber">{t("awards.inProgress")}</Badge>
                )}
              </div>

              <dl className="mt-5 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-400">{t("awards.goal")}</dt>
                  <dd className="font-semibold text-white">
                    {t("awards.people", { n: tier.people })}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">{t("awards.deadline")}</dt>
                  <dd className="font-semibold text-white">
                    {t("awards.days", { n: tier.days })}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">{t("awards.rate")}</dt>
                  <dd className="font-semibold text-amber-300">{tier.rate} %</dd>
                </div>
              </dl>

              <div className="mt-5">
                <div className="flex items-center justify-between text-xs">
                  <span className="uppercase tracking-wider text-slate-500">
                    {t("awards.progress")}
                  </span>
                  <span className="font-semibold text-slate-300">
                    {tier.progress} / {tier.people}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full ${
                      tier.achieved
                        ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                        : "bg-gradient-to-r from-amber-400 to-amber-600"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {tier.achieved && tier.bonusKlc > 0 && (
                <p className="mt-4 rounded-xl bg-emerald-400/10 px-4 py-2.5 text-sm font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-400/25">
                  {t("awards.bonus")} : +{fmtKlc(tier.bonusKlc)} KLC
                </p>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <p className="text-sm leading-relaxed text-slate-400">
          {t("awards.mentorInfo")}
        </p>
      </Card>
    </div>
  );
}
