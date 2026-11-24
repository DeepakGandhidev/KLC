/** Shared client-side shapes mirroring the JSON API contract. */

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  referralCode: string;
  referredBy: string | null;
  klcBalance: number;
  totalMined: number;
  totalReferralEarnings: number;
  totalBonus: number;
  language: string;
  createdAt: string;
}

export interface PlanApi {
  _id: string;
  slug: string;
  name: string;
  priceUsd: number;
  durationMonths: number;
  dailyKlc: number;
  referralRates: { g1: number; g2: number; g3: number };
  order: number;
}

export type MembershipStatus = "active" | "expired" | "cancelled";

export interface MembershipApi {
  _id: string;
  user: string;
  plan: string;
  planName: string;
  priceUsd: number;
  dailyKlc: number;
  startDate: string;
  endDate: string;
  status: MembershipStatus;
  lastCreditedAt: string | null;
  totalMined: number;
  isRenewal: boolean;
  createdAt: string;
}

export interface ReferralMember {
  id: string;
  name: string;
  joinedAt: string;
  volume: number;
}

export interface ReferralsData {
  referralCode: string;
  generations: {
    g1: ReferralMember[];
    g2: ReferralMember[];
    g3: ReferralMember[];
  };
  counts: { g1: number; g2: number; g3: number };
  commissions: { g1: number; g2: number; g3: number };
}

export type AwardRank = "SAPPHIRE" | "EMERALD" | "RUBY" | "DIAMOND" | "CROWN";

export interface AwardTierApi {
  rank: AwardRank;
  people: number;
  days: number;
  rate: number;
  achieved: boolean;
  achievedAt: string | null;
  bonusKlc: number;
  progress: number;
}

export type TxType =
  | "purchase"
  | "mining"
  | "referral_g1"
  | "referral_g2"
  | "referral_g3"
  | "renewal_bonus"
  | "award"
  | "mentor_bonus"
  | "withdrawal"
  | "withdrawal_fee"
  | "withdrawal_refund"
  | "adjustment";

export interface TransactionApi {
  _id: string;
  type: TxType;
  amount: number;
  balanceAfter: number;
  description: string;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

export interface WalletData {
  balance: number;
  totalMined: number;
  totalReferralEarnings: number;
  totalBonus: number;
  transactions: TransactionApi[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export type WithdrawalStatus = "pending" | "approved" | "rejected";

export interface WithdrawalApi {
  _id: string;
  amountKlc: number;
  feeKlc: number;
  netKlc: number;
  destination: string;
  status: WithdrawalStatus;
  createdAt: string;
  processedAt: string | null;
}

export interface AdminStats {
  users: number;
  activeMemberships: number;
  totalVolumeUsd: number;
  pendingWithdrawals: number;
  klcDistributed: number;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  referralCode: string;
  klcBalance: number;
  totalMined: number;
  createdAt: string;
  refsCount: number;
}

export interface AdminWithdrawal {
  _id: string;
  amountKlc: number;
  feeKlc: number;
  netKlc: number;
  destination: string;
  status: WithdrawalStatus;
  createdAt: string;
  processedAt: string | null;
  user: { name: string; email: string } | null;
}

export interface AdminMembership {
  _id: string;
  planName: string;
  priceUsd: number;
  dailyKlc: number;
  startDate: string;
  endDate: string;
  status: MembershipStatus;
  totalMined: number;
  isRenewal: boolean;
  createdAt: string;
  user: { name: string; email: string } | null;
}
