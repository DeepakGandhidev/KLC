import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { ok, fail } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return fail("unauthorized", 403);

  await connectDB();

  const users = await User.aggregate([
    { $sort: { createdAt: -1 } },
    { $limit: 200 },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "referredBy",
        as: "refs",
      },
    },
    {
      $project: {
        name: 1,
        email: 1,
        role: 1,
        referralCode: 1,
        klcBalance: 1,
        totalMined: 1,
        createdAt: 1,
        refsCount: { $size: "$refs" },
      },
    },
  ]);

  return ok({
    users: users.map((u) => ({ ...u, id: String(u._id) })),
  });
}
