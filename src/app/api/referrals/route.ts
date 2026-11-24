import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Membership } from "@/models/Membership";
import { Transaction } from "@/models/Transaction";
import { ok, fail } from "@/lib/api";
import { Types } from "mongoose";

export const dynamic = "force-dynamic";

async function volumeByUser(userIds: Types.ObjectId[]) {
  const volumes = await Membership.aggregate<{
    _id: Types.ObjectId;
    volume: number;
  }>([
    { $match: { user: { $in: userIds } } },
    { $group: { _id: "$user", volume: { $sum: "$priceUsd" } } },
  ]);
  return new Map(volumes.map((v) => [String(v._id), v.volume]));
}

function shapeMember(
  u: { _id: Types.ObjectId; name: string; createdAt: Date },
  volumes: Map<string, number>
) {
  return {
    id: String(u._id),
    name: u.name,
    joinedAt: u.createdAt,
    volume: volumes.get(String(u._id)) ?? 0,
  };
}

export async function GET() {
  const user = await requireUser();
  if (!user) return fail("unauthorized", 401);

  await connectDB();

  const g1 = await User.find({ referredBy: user._id })
    .sort({ createdAt: -1 })
    .lean();
  const g2 = g1.length
    ? await User.find({ referredBy: { $in: g1.map((u) => u._id) } })
        .sort({ createdAt: -1 })
        .lean()
    : [];
  const g3 = g2.length
    ? await User.find({ referredBy: { $in: g2.map((u) => u._id) } })
        .sort({ createdAt: -1 })
        .lean()
    : [];

  const volumes = await volumeByUser([
    ...g1.map((u) => u._id),
    ...g2.map((u) => u._id),
    ...g3.map((u) => u._id),
  ]);

  // commission totals per generation for this user
  const commissionAgg = await Transaction.aggregate<{
    _id: string;
    total: number;
  }>([
    {
      $match: {
        user: user._id,
        type: { $in: ["referral_g1", "referral_g2", "referral_g3"] },
      },
    },
    { $group: { _id: "$type", total: { $sum: "$amount" } } },
  ]);
  const commissions = { g1: 0, g2: 0, g3: 0 };
  for (const row of commissionAgg) {
    if (row._id === "referral_g1") commissions.g1 = row.total;
    if (row._id === "referral_g2") commissions.g2 = row.total;
    if (row._id === "referral_g3") commissions.g3 = row.total;
  }

  return ok({
    referralCode: user.referralCode,
    generations: {
      g1: g1.map((u) => shapeMember(u, volumes)),
      g2: g2.map((u) => shapeMember(u, volumes)),
      g3: g3.map((u) => shapeMember(u, volumes)),
    },
    counts: { g1: g1.length, g2: g2.length, g3: g3.length },
    commissions,
  });
}
