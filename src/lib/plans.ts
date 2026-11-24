/**
 * KLAUN-EC economic model — single source of truth.
 * Values come directly from the KLAUN-EC whitepaper
 * ("Introduction et Modèle Économique").
 */

export interface PlanDef {
  slug: string;
  name: string;
  priceUsd: number;
  durationMonths: number;
  dailyKlc: number;
  referralRates: { g1: number; g2: number; g3: number }; // percent
  order: number;
}

export const PLANS: PlanDef[] = [
  { slug: "starter",  name: "STARTER",  priceUsd: 10,   durationMonths: 2,  dailyKlc: 0.1,  referralRates: { g1: 5,    g2: 2,   g3: 1    }, order: 1 },
  { slug: "bronze",   name: "BRONZE",   priceUsd: 25,   durationMonths: 3,  dailyKlc: 0.25, referralRates: { g1: 5.5,  g2: 2,   g3: 1    }, order: 2 },
  { slug: "silver",   name: "SILVER",   priceUsd: 50,   durationMonths: 3,  dailyKlc: 0.5,  referralRates: { g1: 6,    g2: 2,   g3: 1    }, order: 3 },
  { slug: "gold",     name: "GOLD",     priceUsd: 100,  durationMonths: 6,  dailyKlc: 1,    referralRates: { g1: 7,    g2: 2.5, g3: 1.25 }, order: 4 },
  { slug: "platinum", name: "PLATINUM", priceUsd: 250,  durationMonths: 6,  dailyKlc: 2.5,  referralRates: { g1: 8,    g2: 2.5, g3: 1.25 }, order: 5 },
  { slug: "diamond",  name: "DIAMOND",  priceUsd: 500,  durationMonths: 9,  dailyKlc: 5,    referralRates: { g1: 9,    g2: 3,   g3: 1.5  }, order: 6 },
  { slug: "hub-1000", name: "HUB 1000", priceUsd: 1000, durationMonths: 9,  dailyKlc: 10,   referralRates: { g1: 10,   g2: 3,   g3: 1.5  }, order: 7 },
  { slug: "hub-1200", name: "HUB 1200", priceUsd: 1200, durationMonths: 12, dailyKlc: 12,   referralRates: { g1: 10.5, g2: 3,   g3: 1.5  }, order: 8 },
  { slug: "hub-1500", name: "HUB 1500", priceUsd: 1500, durationMonths: 12, dailyKlc: 15,   referralRates: { g1: 11,   g2: 3.5, g3: 1.75 }, order: 9 },
  { slug: "hub-1800", name: "HUB 1800", priceUsd: 1800, durationMonths: 12, dailyKlc: 18,   referralRates: { g1: 12,   g2: 3.5, g3: 1.75 }, order: 10 },
  { slug: "hub-2000", name: "HUB 2000", priceUsd: 2000, durationMonths: 12, dailyKlc: 20,   referralRates: { g1: 12.5, g2: 4,   g3: 2    }, order: 11 },
];

/** Renewal / upgrade bonus: rate depends on the renewed plan's price bracket. */
export const RENEWAL_BONUS = {
  lowBracketMaxUsd: 1000, // plans priced 10..1000 USD
  lowRate: 5,             // percent
  highRate: 7.5,          // percent for plans 1200..2000 USD
} as const;

export interface AwardTier {
  rank: "SAPPHIRE" | "EMERALD" | "RUBY" | "DIAMOND" | "CROWN";
  people: number;   // direct referrals required
  days: number;     // deadline window in days
  rate: number;     // percent of qualifying volume
  order: number;
}

export const AWARD_TIERS: AwardTier[] = [
  { rank: "SAPPHIRE", people: 20,  days: 10, rate: 10, order: 1 },
  { rank: "EMERALD",  people: 40,  days: 15, rate: 12, order: 2 },
  { rank: "RUBY",     people: 60,  days: 20, rate: 15, order: 3 },
  { rank: "DIAMOND",  people: 100, days: 30, rate: 18, order: 4 },
  { rank: "CROWN",    people: 200, days: 45, rate: 22, order: 5 },
];

/** Mentor bonus: direct sponsor receives this % of a referral's award. */
export const MENTOR_BONUS_RATE = 2; // percent

/** Withdrawal fee applied on each withdrawal. */
export const WITHDRAWAL_FEE_RATE = 5; // percent

/** Reference value announced by the whitepaper. */
export const KLC_REFERENCE_USD = 1;

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Round KLC amounts to 4 decimals to avoid floating point drift. */
export function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

export function renewalRateForPrice(priceUsd: number): number {
  return priceUsd <= RENEWAL_BONUS.lowBracketMaxUsd
    ? RENEWAL_BONUS.lowRate
    : RENEWAL_BONUS.highRate;
}
