import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { creditMiningForUser } from "@/lib/mining";
import { User } from "@/models/User";
import { ok, fail, serialize } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await requireUser();
  if (!session) return fail("unauthorized", 401);

  await connectDB();

  // lazy mining credit so the balance shown is always up to date
  await creditMiningForUser(session._id);
  const fresh = await User.findById(session._id).lean();
  if (!fresh) return fail("unauthorized", 401);

  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page")) || 1);
  const limit = Math.min(
    50,
    Math.max(5, Number(req.nextUrl.searchParams.get("limit")) || 20)
  );

  const [transactions, total] = await Promise.all([
    Transaction.find({ user: session._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Transaction.countDocuments({ user: session._id }),
  ]);

  return ok({
    balance: fresh.klcBalance,
    totalMined: fresh.totalMined,
    totalReferralEarnings: fresh.totalReferralEarnings,
    totalBonus: fresh.totalBonus,
    transactions: serialize(transactions),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}
