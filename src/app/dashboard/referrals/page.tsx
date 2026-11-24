"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { apiGet } from "@/lib/apiClient";
import { fmtDate, fmtKlc, fmtUsd } from "@/lib/format";
import type { ReferralMember, ReferralsData } from "@/lib/types";
import { Icons } from "@/components/icons";
import { Card, Kicker, Spinner } from "@/components/ui";

type Gen = "g1" | "g2" | "g3";
const GENS: Gen[] = ["g1", "g2", "g3"];

export default function ReferralsPage() {
  const { t, lang } = useLanguage();
  const [data, setData] = useState<ReferralsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Gen>("g1");
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await apiGet<ReferralsData>("/api/referrals");
        if (cancelled) return;
        setOrigin(window.location.origin);
        setData(d);
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

  if (loading || !data) return <Spinner label={t("common.loading")} />;

  const link = `${origin}/register?ref=${data.referralCode}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable (permissions); no-op
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <Kicker>{t("nav.referrals")}</Kicker>
        <h1 className="mt-2 text-3xl font-bold text-white">{t("refs.title")}</h1>
        <p className="mt-2 text-slate-400">{t("refs.subtitle")}</p>
      </header>

      {/* Referral link */}
      <Card glow className="p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {t("refs.yourLink")}
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <code className="flex-1 truncate rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-amber-200">
            {link}
          </code>
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 px-5 py-2.5 text-sm font-semibold text-black transition hover:from-amber-300 hover:to-amber-500"
          >
            {copied ? Icons.check("h-4 w-4") : Icons.copy("h-4 w-4")}
            {copied ? t("common.copied") : t("common.copy")}
          </button>
        </div>
        <p className="mt-3 text-sm text-slate-400">
          {t("refs.yourCode")} :{" "}
          <span className="font-bold text-white">{data.referralCode}</span>
        </p>
        <p className="mt-2 text-xs text-slate-500">{t("refs.howItWorks")}</p>
      </Card>

      {/* Commissions per generation */}
      <section>
        <h2 className="text-lg font-bold text-white">{t("refs.totalEarned")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {GENS.map((g) => (
            <Card key={g} className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {t(`refs.${g}`)}
              </p>
              <p className="mt-3 text-2xl font-extrabold text-amber-300">
                {fmtKlc(data.commissions[g])} KLC
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Generation tabs */}
      <section>
        <div className="flex gap-2 overflow-x-auto">
          {GENS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setTab(g)}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                tab === g
                  ? "bg-amber-400/10 text-amber-300 ring-1 ring-inset ring-amber-400/30"
                  : "border border-white/10 text-slate-300 hover:bg-white/5"
              }`}
            >
              {t(`refs.${g}`)}{" "}
              <span className="ml-1 text-xs text-slate-500">
                {data.counts[g]} {t("refs.members")}
              </span>
            </button>
          ))}
        </div>

        <Card className="mt-4">
          {data.generations[tab].length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-500">
              {t("refs.noMembers")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/5 text-sm">
                <thead className="bg-white/[0.03] text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-6 py-3">{t("refs.name")}</th>
                    <th className="px-6 py-3">{t("refs.joined")}</th>
                    <th className="px-6 py-3">{t("refs.invested")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.generations[tab].map((m: ReferralMember) => (
                    <tr key={m.id} className="hover:bg-white/[0.03]">
                      <td className="px-6 py-3 font-medium text-white">{m.name}</td>
                      <td className="px-6 py-3 text-slate-300">
                        {fmtDate(m.joinedAt, lang)}
                      </td>
                      <td className="px-6 py-3 font-semibold text-amber-300">
                        {fmtUsd(m.volume, lang)} USD
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
