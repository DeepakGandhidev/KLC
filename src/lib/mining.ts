import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Membership } from "@/models/Membership";
import { Transaction } from "@/models/Transaction";
import { DAY_MS, round4 } from "@/lib/plans";
import { Types } from "mongoose";

export interface MiningCreditResult {
  credited: number;
  perMembership: Array<{
    membershipId: string;
    planName: string;
    days: number;
    amount: number;
  }>;
}

/**
 * Lazy daily mining credit: credits every full day elapsed since the
 * membership's last credit, capped at the membership end date.
 * Safe to call on every dashboard load and from the cron route.
 */
export async function creditMiningForUser(
  userId: string | Types.ObjectId
): Promise<MiningCreditResult> {
  await connectDB();
  const user = await User.findById(userId);
  const result: MiningCreditResult = { credited: 0, perMembership: [] };
  if (!user) return result;

  const now = new Date();
  const memberships = await Membership.find({
    user: user._id,
    status: "active",
  });

  for (const m of memberships) {
    const creditTo = now < m.endDate ? now : m.endDate;
    const days = Math.floor(
      (creditTo.getTime() - m.lastCreditedAt.getTime()) / DAY_MS
    );

    if (days > 0) {
      const amount = round4(days * m.dailyKlc);
      m.totalMined = round4(m.totalMined + amount);
      m.lastCreditedAt = new Date(m.lastCreditedAt.getTime() + days * DAY_MS);
      result.credited = round4(result.credited + amount);
      result.perMembership.push({
        membershipId: String(m._id),
        planName: m.planName,
        days,
        amount,
      });
    }

    // Fully credited up to the end date -> the membership is done.
    if (m.lastCreditedAt >= m.endDate) {
      m.status = "expired";
    }

    await m.save();

    if (days > 0) {
      await Transaction.create({
        user: user._id,
        type: "mining",
        amount: result.perMembership[result.perMembership.length - 1].amount,
        balanceAfter: round4(user.klcBalance + result.credited),
        description: `Minage ${m.planName} (${days} j)`,
        meta: { membershipId: String(m._id), days },
      });
    }
  }

  if (result.credited > 0) {
    user.klcBalance = round4(user.klcBalance + result.credited);
    user.totalMined = round4(user.totalMined + result.credited);
    await user.save();
  }

  return result;
}

/** Credits mining for every user that has an active membership (cron use). */
export async function creditMiningForAllUsers(): Promise<{
  users: number;
  credited: number;
}> {
  await connectDB();
  const userIds = await Membership.distinct("user", { status: "active" });
  let users = 0;
  let credited = 0;
  for (const id of userIds) {
    const r = await creditMiningForUser(id);
    if (r.credited > 0) {
      users += 1;
      credited = round4(credited + r.credited);
    }
  }
  return { users, credited };
}
