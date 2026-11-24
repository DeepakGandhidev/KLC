import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Withdrawal } from "@/models/Withdrawal";
import { ok, fail, serialize } from "@/lib/api";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const STATUSES = ["pending", "approved", "rejected"] as const;
type Status = (typeof STATUSES)[number];

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return fail("unauthorized", 403);

  await connectDB();

  const status = req.nextUrl.searchParams.get("status") as Status | null;
  const filter: { status?: Status } =
    status && STATUSES.includes(status) ? { status } : {};

  const withdrawals = await Withdrawal.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .populate("user", "name email")
    .lean();

  return ok({ withdrawals: serialize(withdrawals) });
}
