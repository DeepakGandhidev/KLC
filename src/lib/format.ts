import type { Lang } from "@/lib/i18n/dictionaries";

/** KLC amount: up to 4 decimals, trailing zeros trimmed. */
export function fmtKlc(n: number): string {
  if (!Number.isFinite(n)) return "0";
  return String(Math.round(n * 10000) / 10000);
}

/** USD-style number formatted with locale-aware grouping. */
export function fmtUsd(n: number, lang: Lang): string {
  if (!Number.isFinite(n)) n = 0;
  return n.toLocaleString(lang === "fr" ? "fr-FR" : "en-US", {
    maximumFractionDigits: 2,
  });
}

/** Date like "24 nov. 2026" / "Nov 24, 2026". Accepts ISO strings or Date. */
export function fmtDate(d: string | Date, lang: Lang): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
