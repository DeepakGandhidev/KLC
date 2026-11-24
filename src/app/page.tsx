"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { apiGet } from "@/lib/apiClient";
import { fmtKlc, fmtUsd } from "@/lib/format";
import type { PlanApi } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Icons } from "@/components/icons";
import {
  Badge,
  Card,
  Kicker,
  btnPrimary,
  btnSecondary,
  tableClass,
  tableWrap,
  tdClass,
  thClass,
  theadClass,
} from "@/components/ui";

const POPULAR_SLUG = "gold";

const AWARD_RANKS = [
  { rank: "SAPPHIRE", people: 20, days: 10, rate: 10 },
  { rank: "EMERALD", people: 40, days: 15, rate: 12 },
  { rank: "RUBY", people: 60, days: 20, rate: 15 },
  { rank: "DIAMOND", people: 100, days: 30, rate: 18 },
  { rank: "CROWN", people: 200, days: 45, rate: 22 },
];

export default function LandingPage() {
  const { t, lang } = useLanguage();
  const [plans, setPlans] = useState<PlanApi[]>([]);

  useEffect(() => {
    apiGet<{ plans: PlanApi[] }>("/api/plans")
      .then((d) => setPlans(d.plans))
      .catch(() => setPlans([]));
  }, []);

  const statPlans = plans.length || 11;
  const statMonths = plans.length
    ? `${Math.min(...plans.map((p) => p.durationMonths))} → ${Math.max(
        ...plans.map((p) => p.durationMonths)
      )}`
    : "2 → 12";
  const statMax = plans.length
    ? fmtKlc(Math.max(...plans.map((p) => p.dailyKlc)))
    : "20";

  return (
    <div className="relative flex-1">
      <LandingNav />
      <Hero />

      {/* Intro */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <Kicker>{t("landing.intro.kicker")}</Kicker>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
              {t("landing.intro.title")}
            </h2>
            <p className="mt-5 leading-relaxed text-slate-300">
              {t("landing.intro.p1")}
            </p>
            <p className="mt-4 leading-relaxed text-slate-400">
              {t("landing.intro.p2")}
            </p>
          </div>
          <Card glow className="p-8 text-center">
            <p className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-4xl font-extrabold text-transparent">
              1 KLC = 1 USD
            </p>
            <p className="mt-3 text-sm text-slate-400">
              {t("landing.hero.reference")}
            </p>
          </Card>
        </div>
      </section>

      {/* Smart mining */}
      <section id="mining" className="scroll-mt-24 border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Kicker>{t("landing.mining.kicker")}</Kicker>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold text-white sm:text-4xl">
            {t("landing.mining.title")}
          </h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <p className="leading-relaxed text-slate-300">{t("landing.mining.p1")}</p>
            <p className="leading-relaxed text-slate-400">{t("landing.mining.p2")}</p>
          </div>
          <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            {(["step1", "step2", "step3"] as const).map((step, i) => (
              <div key={step} className="flex flex-1 items-center gap-3">
                <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300 ring-1 ring-inset ring-amber-400/30">
                    {i + 1}
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {t(`landing.mining.${step}`)}
                  </span>
                </div>
                {i < 2 && (
                  <span className="hidden text-amber-400/60 sm:block">
                    {Icons.chevronRight("h-5 w-5")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <Kicker>{t("landing.principles.kicker")}</Kicker>
        <h2 className="mt-3 max-w-2xl text-3xl font-bold text-white sm:text-4xl">
          {t("landing.principles.title")}
        </h2>
        <p className="mt-5 max-w-3xl leading-relaxed text-slate-400">
          {t("landing.principles.p1")}
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {(
            [
              { n: 1, icon: "mining" },
              { n: 2, icon: "spark" },
              { n: 3, icon: "users" },
            ] as const
          ).map(({ n, icon }) => (
            <Card key={n} className="p-6 transition hover:border-amber-400/30">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300 ring-1 ring-inset ring-amber-400/30">
                {Icons[icon]("h-5 w-5")}
              </span>
              <h3 className="mt-4 text-lg font-bold text-white">
                {t(`landing.principles.${n}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {t(`landing.principles.${n}.text`)}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="scroll-mt-24 border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center">
            <Kicker>{t("landing.plans.kicker")}</Kicker>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
              {t("landing.plans.title")}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-400">
              {t("landing.plans.subtitle")}
            </p>
          </div>

          <div className={`mt-10 ${tableWrap}`}>
            <table className={tableClass}>
              <thead className={theadClass}>
                <tr>
                  <th className={thClass}>{t("landing.plans.plan")}</th>
                  <th className={thClass}>{t("landing.plans.price")}</th>
                  <th className={thClass}>{t("landing.plans.duration")}</th>
                  <th className={thClass}>{t("landing.plans.daily")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {plans.map((p) => {
                  const popular = p.slug === POPULAR_SLUG;
                  return (
                    <tr
                      key={p._id}
                      className={
                        popular ? "bg-amber-400/[0.07]" : "hover:bg-white/[0.03]"
                      }
                    >
                      <td className={`${tdClass} font-semibold text-white`}>
                        <span className="flex items-center gap-2">
                          {p.name}
                          {popular && (
                            <Badge tone="amber">{t("landing.plans.popular")}</Badge>
                          )}
                        </span>
                      </td>
                      <td className={tdClass}>{fmtUsd(p.priceUsd, lang)} USD</td>
                      <td className={tdClass}>
                        {p.durationMonths} {t("common.months")}
                      </td>
                      <td className={`${tdClass} font-semibold text-amber-300`}>
                        {fmtKlc(p.dailyKlc)} KLC {t("common.perDay")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { v: String(statPlans), l: t("landing.plans.statPlans") },
              { v: statMonths, l: t("landing.plans.statMonths") },
              { v: statMax, l: t("landing.plans.statMax") },
            ].map((s, i) => (
              <Card key={i} className="p-6 text-center">
                <p className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-3xl font-extrabold text-transparent">
                  {s.v}
                </p>
                <p className="mt-2 text-xs uppercase tracking-wider text-slate-400">
                  {s.l}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Hub */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center">
          <Kicker>{t("landing.hub.kicker")}</Kicker>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            {t("landing.hub.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            {t("landing.hub.subtitle")}
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {([1, 2, 3] as const).map((n) => (
            <Card key={n} className="relative p-6 pt-8">
              <span className="absolute -top-4 left-6 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 px-3 py-1 text-xs font-extrabold text-black">
                {String(n).padStart(2, "0")}
              </span>
              <h3 className="text-lg font-bold text-white">
                {t(`landing.hub.step${n}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {t(`landing.hub.step${n}.text`)}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Referral */}
      <section id="referral" className="scroll-mt-24 border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Kicker>{t("landing.referral.kicker")}</Kicker>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            {t("landing.referral.title")}
          </h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-slate-400">
            {t("landing.referral.subtitle")}
          </p>

          <div className={`mt-10 ${tableWrap}`}>
            <table className={tableClass}>
              <thead className={theadClass}>
                <tr>
                  <th className={thClass}>{t("landing.plans.plan")}</th>
                  <th className={thClass}>{t("landing.referral.g1")}</th>
                  <th className={thClass}>{t("landing.referral.g2")}</th>
                  <th className={thClass}>{t("landing.referral.g3")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {plans.map((p) => (
                  <tr key={p._id} className="hover:bg-white/[0.03]">
                    <td className={`${tdClass} font-semibold text-white`}>{p.name}</td>
                    <td className={`${tdClass} text-amber-300`}>{p.referralRates.g1} %</td>
                    <td className={tdClass}>{p.referralRates.g2} %</td>
                    <td className={tdClass}>{p.referralRates.g3} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {(["g1", "g2", "g3"] as const).map((g) => (
              <Card key={g} className="p-5">
                <p className="text-sm font-bold text-amber-300">
                  {t(`landing.referral.${g}`)}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {t(`landing.referral.${g}.desc`)}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Upgrade bonus */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <Kicker>{t("landing.upgrade.kicker")}</Kicker>
        <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          {t("landing.upgrade.title")}
        </h2>
        <p className="mt-4 max-w-3xl leading-relaxed text-slate-400">
          {t("landing.upgrade.subtitle")}
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className={tableWrap}>
            <table className={tableClass}>
              <thead className={theadClass}>
                <tr>
                  <th className={thClass}>{t("landing.upgrade.plans")}</th>
                  <th className={thClass}>{t("landing.upgrade.range")}</th>
                  <th className={thClass}>{t("landing.upgrade.rate")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className={`${tdClass} font-semibold text-white`}>
                    {t("landing.upgrade.low")}
                  </td>
                  <td className={tdClass}>{t("landing.upgrade.lowRange")}</td>
                  <td className={`${tdClass} font-semibold text-amber-300`}>5 %</td>
                </tr>
                <tr>
                  <td className={`${tdClass} font-semibold text-white`}>
                    {t("landing.upgrade.high")}
                  </td>
                  <td className={tdClass}>{t("landing.upgrade.highRange")}</td>
                  <td className={`${tdClass} font-semibold text-amber-300`}>7.5 %</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="space-y-4">
            {([1, 2, 3] as const).map((n) => (
              <Card key={n} className="p-5">
                <p className="text-sm font-bold text-white">
                  {t(`landing.upgrade.f${n}.title`)}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {t(`landing.upgrade.f${n}.text`)}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Awards */}
      <section id="awards" className="scroll-mt-24 border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Kicker>{t("landing.award.kicker")}</Kicker>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            {t("landing.award.title")}
          </h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-slate-400">
            {t("landing.award.subtitle")}
          </p>

          <div className={`mt-10 ${tableWrap}`}>
            <table className={tableClass}>
              <thead className={theadClass}>
                <tr>
                  <th className={thClass}>{t("landing.award.rank")}</th>
                  <th className={thClass}>{t("landing.award.goal")}</th>
                  <th className={thClass}>{t("landing.award.deadline")}</th>
                  <th className={thClass}>{t("landing.award.rate")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {AWARD_RANKS.map((r) => (
                  <tr key={r.rank} className="hover:bg-white/[0.03]">
                    <td className={`${tdClass} font-semibold text-white`}>
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rotate-45 rounded-[2px] bg-gradient-to-br from-amber-300 to-amber-600" />
                        {r.rank}
                      </span>
                    </td>
                    <td className={tdClass}>
                      {t("landing.award.people", { n: r.people })}
                    </td>
                    <td className={tdClass}>
                      {t("landing.award.days", { n: r.days })}
                    </td>
                    <td className={`${tdClass} font-semibold text-amber-300`}>
                      {r.rate} %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Progression visual */}
          <div className="mt-12">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-amber-400/80">
              {t("landing.award.progression")}
            </p>
            <div className="mt-6 flex items-start">
              {AWARD_RANKS.map((r, i) => (
                <div key={r.rank} className="flex flex-1 items-start last:flex-none">
                  <div className="flex flex-col items-center gap-2">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full border text-xs font-extrabold ${
                        i === AWARD_RANKS.length - 1
                          ? "border-amber-400 bg-gradient-to-br from-amber-300 to-amber-600 text-black shadow-[0_0_24px_-6px_rgba(245,185,66,0.8)]"
                          : "border-amber-400/40 bg-amber-400/10 text-amber-300"
                      }`}
                    >
                      {r.rate}%
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
                      {r.rank}
                    </span>
                  </div>
                  {i < AWARD_RANKS.length - 1 && (
                    <div className="mx-1 mt-5 h-px flex-1 bg-gradient-to-r from-amber-400/50 to-amber-400/10 sm:mx-2" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mentor & fee */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <Kicker>{t("landing.mentor.kicker")}</Kicker>
        <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          {t("landing.mentor.title")}
        </h2>
        <p className="mt-4 max-w-3xl leading-relaxed text-slate-400">
          {t("landing.mentor.subtitle")}
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300 ring-1 ring-inset ring-amber-400/30">
              {Icons.gift("h-5 w-5")}
            </span>
            <h3 className="mt-4 text-lg font-bold text-white">
              {t("landing.mentor.bonus.title")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {t("landing.mentor.bonus.text")}
            </p>
            <p className="mt-4 rounded-xl bg-amber-400/10 px-4 py-2.5 text-sm font-semibold text-amber-300 ring-1 ring-inset ring-amber-400/25">
              {t("landing.mentor.bonus.example")}
            </p>
          </Card>
          <Card className="p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300 ring-1 ring-inset ring-amber-400/30">
              {Icons.wallet("h-5 w-5")}
            </span>
            <h3 className="mt-4 text-lg font-bold text-white">
              {t("landing.mentor.fee.title")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {t("landing.mentor.fee.text")}
            </p>
            <p className="mt-4 rounded-xl bg-amber-400/10 px-4 py-2.5 text-sm font-semibold text-amber-300 ring-1 ring-inset ring-amber-400/25">
              {t("landing.mentor.fee.example")}
            </p>
          </Card>
        </div>
      </section>

      {/* Exchange */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <Kicker>{t("landing.exchange.kicker")}</Kicker>
          <Card glow className="mt-6 p-10">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-600 text-black">
              {Icons.exchange("h-6 w-6")}
            </span>
            <h2 className="mt-5 text-3xl font-bold text-white">
              {t("landing.exchange.title")}
            </h2>
            <p className="mt-3 font-semibold text-amber-300">
              {t("landing.exchange.subtitle")}
            </p>
            <p className="mt-4 leading-relaxed text-slate-400">
              {t("landing.exchange.text")}
            </p>
            <p className="mt-6 text-sm font-semibold text-white">
              {t("landing.exchange.reference")}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {t("landing.exchange.disclaimer")}
            </p>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="relative overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-br from-amber-400/15 via-transparent to-transparent p-10 text-center sm:p-16">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            {t("landing.cta.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">
            {t("landing.cta.subtitle")}
          </p>
          <Link href="/register" className={`${btnPrimary} mt-8 px-8 py-3 text-base`}>
            {t("landing.cta.button")}
            {Icons.arrowRight("h-4 w-4")}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <Logo />
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-amber-400/70">
                {t("landing.footer.tagline")}
              </p>
            </div>
            <LanguageToggle />
          </div>
          <p className="mt-8 max-w-3xl text-xs leading-relaxed text-slate-500">
            {t("landing.footer.disclaimer")}
          </p>
          <p className="mt-6 text-xs text-slate-500">
            © 2026 KLAUN-EC — {t("landing.footer.rights")}
          </p>
        </div>
      </footer>
    </div>
  );
}

function LandingNav() {
  const { t } = useLanguage();
  const links = [
    { href: "#mining", label: t("landing.nav.mining") },
    { href: "#plans", label: t("landing.nav.plans") },
    { href: "#referral", label: t("landing.nav.referral") },
    { href: "#awards", label: t("landing.nav.awards") },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070b14]/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Logo />
        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-slate-300 transition hover:text-amber-300"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <Link
            href="/login"
            className={`${btnSecondary} hidden px-4! py-2! sm:inline-flex`}
          >
            {t("common.login")}
          </Link>
          <Link href="/register" className={`${btnPrimary} px-4! py-2!`}>
            {t("common.register")}
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const { t } = useLanguage();
  return (
    <section className="relative overflow-hidden">
      {/* gold radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 45% at 50% 0%, rgba(245,185,66,0.16), transparent 70%)",
        }}
      />
      {/* grid pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.13]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 20%, black, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 20%, black, transparent 75%)",
        }}
      />
      <div className="relative mx-auto max-w-4xl px-6 pb-24 pt-24 text-center sm:pt-32">
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          {t("landing.hero.badge")}
        </span>
        <h1 className="mt-8 bg-gradient-to-b from-white via-white to-amber-200/80 bg-clip-text text-4xl font-extrabold leading-tight text-transparent sm:text-6xl">
          {t("landing.hero.title")}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl leading-relaxed text-slate-400">
          {t("landing.hero.subtitle")}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/register" className={`${btnPrimary} px-7 py-3 text-base`}>
            {t("landing.hero.cta")}
            {Icons.arrowRight("h-4 w-4")}
          </Link>
          <a href="#plans" className={`${btnSecondary} px-7 py-3 text-base`}>
            {t("landing.hero.cta2")}
          </a>
        </div>
        <p className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-slate-300">
          <span className="h-2 w-2 rotate-45 rounded-[2px] bg-amber-400" />
          {t("landing.hero.reference")}
        </p>
      </div>
    </section>
  );
}
