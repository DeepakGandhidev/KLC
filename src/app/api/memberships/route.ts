import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Membership } from "@/models/Membership";
import { purchaseMembership, PurchaseError } from "@/lib/commissions";
import { ok, fail, serialize } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();
  if (!user) return fail("unauthorized", 401);

  await connectDB();
  const memberships = await Membership.find({ user: user._id })
    .sort({ createdAt: -1 })
    .lean();
  return ok({ memberships: serialize(memberships) });
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return fail("unauthorized", 401);

  try {
    const body = await req.json();
    const planSlug = String(body.planSlug ?? "");
    if (!planSlug) return fail("missing_fields");

    const membership = await purchaseMembership(user._id, planSlug);
    return ok({ membership: serialize(membership) });
  } catch (e) {
    if (e instanceof PurchaseError) {
      return fail(e.message, e.message === "plan_not_found" ? 404 : 400);
    }
    console.error("purchase error", e);
    return fail("server_error", 500);
  }
}
