import { connectDB } from "@/lib/mongodb";
import { User, IUser } from "@/models/User";
import { Plan } from "@/models/Plan";
import { Membership, IMembership } from "@/models/Membership";
import { Transaction } from "@/models/Transaction";
import { Award } from "@/models/Award";
import {
  AWARD_TIERS,
  MENTOR_BONUS_RATE,
  DAY_MS,
  round4,
  renewalRateForPrice,
} from "@/lib/plans";
import { Types } from "mongoose";

export class PurchaseError extends Error {}

/**
 * Full membership purchase flow:
 *  1. create the membership (renewal flag if the member still has an active one)
 *  2. pay G1/G2/G3 referral commissions to the upline chain
 *  3. pay the renewal/upgrade bonus to the direct sponsor when applicable
 *  4. re-evaluate the direct sponsor's award-program progress
 */
export async function purchaseMembership(
  userId: string | Types.ObjectId,
  planSlug: string
): Promise<IMembership> {
  await connectDB();

  const user = await User.findById(userId);
  if (!user) throw new PurchaseError("user_not_found");

  const plan = await Plan.findOne({ slug: planSlug, active: true });
  if (!plan) throw new PurchaseError("plan_not_found");

  const existingActive = await Membership.findOne({
    user: user._id,
    status: "active",
  });
  const isRenewal = !!existingActive;

  const start = new Date();
  const end = new Date(start);
  end.setMonth(end.getMonth() + plan.durationMonths);

  const membership = await Membership.create({
    user: user._id,
    plan: plan._id,
    planName: plan.name,
    priceUsd: plan.priceUsd,
    dailyKlc: plan.dailyKlc,
    startDate: start,
    endDate: end,
    lastCreditedAt: start,
    isRenewal,
  });

  await Transaction.create({
    user: user._id,
    type: "purchase",
    amount: 0,
    balanceAfter: user.klcBalance,
    description: `Achat du plan ${plan.name} (${plan.priceUsd} USD)`,
    meta: { membershipId: String(membership._id), plan: plan.slug },
  });

  // --- Referral commissions across 3 generations ---
  const gens = [
    { key: "g1" as const, type: "referral_g1" as const },
    { key: "g2" as const, type: "referral_g2" as const },
    { key: "g3" as const, type: "referral_g3" as const },
  ];

  let current: IUser = user;
  for (let g = 0; g < gens.length; g++) {
    if (!current.referredBy) break;
    const upline = await User.findById(current.referredBy);
    if (!upline) break;

    const rate = plan.referralRates[gens[g].key];
    const amount = round4((plan.priceUsd * rate) / 100);
    if (amount > 0) {
      upline.klcBalance = round4(upline.klcBalance + amount);
      upline.totalReferralEarnings = round4(
        upline.totalReferralEarnings + amount
      );
      await upline.save();

      await Transaction.create({
        user: upline._id,
        type: gens[g].type,
        amount,
        balanceAfter: upline.klcBalance,
        description: `Commission ${gens[g].key.toUpperCase()} — ${user.name} (${plan.name})`,
        meta: {
          fromUser: String(user._id),
          fromUserName: user.name,
          plan: plan.slug,
          rate,
        },
      });
    }

    // --- Renewal / upgrade bonus: direct sponsor only, referred member's
    // previous contract must still be active ---
    if (g === 0 && isRenewal) {
      const rRate = renewalRateForPrice(plan.priceUsd);
      const rAmount = round4((plan.priceUsd * rRate) / 100);
      if (rAmount > 0) {
        upline.klcBalance = round4(upline.klcBalance + rAmount);
        upline.totalBonus = round4(upline.totalBonus + rAmount);
        await upline.save();

        await Transaction.create({
          user: upline._id,
          type: "renewal_bonus",
          amount: rAmount,
          balanceAfter: upline.klcBalance,
          description: `Bonus renouvellement — ${user.name} (${plan.name})`,
          meta: {
            fromUser: String(user._id),
            fromUserName: user.name,
            plan: plan.slug,
            rate: rRate,
          },
        });
      }
    }

    current = upline;
  }

  // --- Award program: re-evaluate the direct sponsor ---
  if (user.referredBy) {
    await checkAndGrantAwards(user.referredBy);
  }

  return membership;
}

/**
 * Checks every award tier for a user and grants newly reached ones.
 * A tier is reached when at least `people` direct referrals who own a
 * membership registered within any sliding window of `days` days.
 * The bonus is `rate` % of the qualifying referrals' membership volume.
 * The direct sponsor receives MENTOR_BONUS_RATE % of the award.
 */
export async function checkAndGrantAwards(
  userId: string | Types.ObjectId
): Promise<void> {
  await connectDB();
  const user = await User.findById(userId);
  if (!user) return;

  const directRefs = await User.find({ referredBy: user._id })
    .sort({ createdAt: 1 })
    .lean();
  if (directRefs.length === 0) return;

  const volumes = await Membership.aggregate<{
    _id: Types.ObjectId;
    volume: number;
  }>([
    { $match: { user: { $in: directRefs.map((r) => r._id) } } },
    { $group: { _id: "$user", volume: { $sum: "$priceUsd" } } },
  ]);
  const volumeByRef = new Map(volumes.map((v) => [String(v._id), v.volume]));

  const qualified = directRefs.filter((r) => volumeByRef.has(String(r._id)));
  if (qualified.length === 0) return;

  const achieved = new Set(
    (await Award.find({ user: user._id }).lean()).map((a) => a.rank)
  );

  for (const tier of AWARD_TIERS) {
    if (achieved.has(tier.rank)) continue;
    if (qualified.length < tier.people) break; // tiers are ordered

    const dates = qualified.map((r) => r.createdAt.getTime()).sort((a, b) => a - b);

    let windowRefs: typeof qualified | null = null;
    for (let i = 0; i + tier.people <= dates.length; i++) {
      const windowEnd = dates[i] + tier.days * DAY_MS;
      const inWindow = qualified.filter(
        (r) =>
          r.createdAt.getTime() >= dates[i] &&
          r.createdAt.getTime() <= windowEnd
      );
      if (inWindow.length >= tier.people) {
        windowRefs = inWindow.slice(0, tier.people);
        break;
      }
    }

    if (!windowRefs) continue;

    const qualifyingVolume = round4(
      windowRefs.reduce(
        (sum, r) => sum + (volumeByRef.get(String(r._id)) ?? 0),
        0
      )
    );
    const bonus = round4((qualifyingVolume * tier.rate) / 100);

    let mentorBonus = 0;
    if (user.referredBy) {
      const mentor = await User.findById(user.referredBy);
      if (mentor) {
        mentorBonus = round4((bonus * MENTOR_BONUS_RATE) / 100);
        if (mentorBonus > 0) {
          mentor.klcBalance = round4(mentor.klcBalance + mentorBonus);
          mentor.totalBonus = round4(mentor.totalBonus + mentorBonus);
          await mentor.save();
          await Transaction.create({
            user: mentor._id,
            type: "mentor_bonus",
            amount: mentorBonus,
            balanceAfter: mentor.klcBalance,
            description: `Mentor Bonus — award ${tier.rank} de ${user.name}`,
            meta: { fromUser: String(user._id), rank: tier.rank },
          });
        }
      }
    }

    await Award.create({
      user: user._id,
      rank: tier.rank,
      achievedAt: new Date(),
      qualifyingVolume,
      bonusKlc: bonus,
      mentorBonusKlc: mentorBonus,
    });

    if (bonus > 0) {
      user.klcBalance = round4(user.klcBalance + bonus);
      user.totalBonus = round4(user.totalBonus + bonus);
      await user.save();
      await Transaction.create({
        user: user._id,
        type: "award",
        amount: bonus,
        balanceAfter: user.klcBalance,
        description: `Award ${tier.rank} — ${tier.rate}% de ${qualifyingVolume} USD`,
        meta: { rank: tier.rank, rate: tier.rate, qualifyingVolume },
      });
    }

    achieved.add(tier.rank);
  }
}

export interface AwardProgress {
  rank: string;
  people: number;
  days: number;
  rate: number;
  achieved: boolean;
  achievedAt: Date | null;
  bonusKlc: number;
  progress: number; // qualified referrals in the tier window, capped at target
}

/** Per-tier progress for the awards page. */
export async function getAwardProgress(
  userId: string | Types.ObjectId
): Promise<AwardProgress[]> {
  await connectDB();
  const user = await User.findById(userId).lean();
  if (!user) return [];

  const directRefs = await User.find({ referredBy: user._id })
    .sort({ createdAt: 1 })
    .lean();
  const volumes = await Membership.aggregate<{
    _id: Types.ObjectId;
    volume: number;
  }>([
    { $match: { user: { $in: directRefs.map((r) => r._id) } } },
    { $group: { _id: "$user", volume: { $sum: "$priceUsd" } } },
  ]);
  const hasMembership = new Set(volumes.map((v) => String(v._id)));
  const qualified = directRefs.filter((r) => hasMembership.has(String(r._id)));
  const dates = qualified.map((r) => r.createdAt.getTime()).sort((a, b) => a - b);

  const achievedAwards = await Award.find({ user: user._id }).lean();
  const achievedMap = new Map(achievedAwards.map((a) => [a.rank, a]));

  return AWARD_TIERS.map((tier) => {
    // best count within any window of tier.days
    let best = 0;
    for (let i = 0; i < dates.length; i++) {
      const windowEnd = dates[i] + tier.days * DAY_MS;
      let count = 0;
      for (let k = i; k < dates.length && dates[k] <= windowEnd; k++) count++;
      best = Math.max(best, count);
    }
    const a = achievedMap.get(tier.rank);
    return {
      rank: tier.rank,
      people: tier.people,
      days: tier.days,
      rate: tier.rate,
      achieved: !!a,
      achievedAt: a ? a.achievedAt : null,
      bonusKlc: a ? a.bonusKlc : 0,
      progress: Math.min(best, tier.people),
    };
  });
}
