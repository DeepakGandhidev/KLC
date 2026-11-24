import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Membership } from "@/models/Membership";
import { Withdrawal } from "@/models/Withdrawal";
import { ok, fail } from "@/lib/api";
import { round4 } from "@/lib/plans";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return fail("unauthorized", 403);

  await connectDB();

  const [users, activeMemberships, volumeAgg, pendingWithdrawals, distAgg] =
    await Promise.all([
      User.countDocuments({}),
      Membership.countDocuments({ status: "active" }),
      Membership.aggregate<{ _id: null; total: number }>([
        { $group: { _id: null, total: { $sum: "$priceUsd" } } },
      ]),
      Withdrawal.countDocuments({ status: "pending" }),
      User.aggregate<{ _id: null; total: number }>([
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $add: [
                  "$totalMined",
                  "$totalReferralEarnings",
                  "$totalBonus",
                ],
              },
            },
          },
        },
      ]),
    ]);

  return ok({
    users,
    activeMemberships,
    totalVolumeUsd: round4(volumeAgg[0]?.total ?? 0),
    pendingWithdrawals,
    klcDistributed: round4(distAgg[0]?.total ?? 0),
  });
}
