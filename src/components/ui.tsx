"use client";

import type { ReactNode } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function Card({
  children,
  className = "",
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white/5 ${
        glow
          ? "border-amber-400/30 shadow-[0_0_60px_-18px_rgba(245,185,66,0.45)]"
          : "border-white/10"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-400/80">
      {children}
    </p>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-1 flex-col items-center justify-center gap-3">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-amber-400" />
      {label ? <p className="text-sm text-slate-400">{label}</p> : null}
    </div>
  );
}

type BadgeTone = "emerald" | "amber" | "slate" | "red";

const TONE_CLASSES: Record<BadgeTone, string> = {
  emerald: "bg-emerald-400/10 text-emerald-300 border-emerald-400/25",
  amber: "bg-amber-400/10 text-amber-300 border-amber-400/25",
  slate: "bg-slate-400/10 text-slate-300 border-slate-400/25",
  red: "bg-red-400/10 text-red-300 border-red-400/25",
};

export function Badge({
  tone,
  children,
}: {
  tone: BadgeTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}

type StatusKind =
  | "active"
  | "approved"
  | "pending"
  | "expired"
  | "cancelled"
  | "rejected";

const STATUS_TONE: Record<StatusKind, BadgeTone> = {
  active: "emerald",
  approved: "emerald",
  pending: "amber",
  expired: "slate",
  cancelled: "slate",
  rejected: "red",
};

export function StatusBadge({ status }: { status: StatusKind }) {
  const { t } = useLanguage();
  return <Badge tone={STATUS_TONE[status]}>{t(`common.${status}`)}</Badge>;
}

export function EmptyState({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-12 text-center">
      <p className="text-sm text-slate-400">{children}</p>
      {action}
    </div>
  );
}

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 px-5 py-2.5 text-sm font-semibold text-black transition hover:from-amber-300 hover:to-amber-500 disabled:cursor-not-allowed disabled:opacity-50";

export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50";

export const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20";

export const tableWrap = "overflow-x-auto rounded-2xl border border-white/10";
export const tableClass = "min-w-full divide-y divide-white/5 text-sm";
export const theadClass =
  "bg-white/[0.03] text-left text-xs font-semibold uppercase tracking-wider text-slate-400";
export const thClass = "px-4 py-3 whitespace-nowrap";
export const tdClass = "px-4 py-3 whitespace-nowrap text-slate-200";
