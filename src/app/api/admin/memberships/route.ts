import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Membership } from "@/models/Membership";
import { ok, fail, serialize } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return fail("unauthorized", 403);

  await connectDB();

  const memberships = await Membership.find({})
    .sort({ createdAt: -1 })
    .limit(200)
    .populate("user", "name email")
    .lean();

  return ok({ memberships: serialize(memberships) });
}
