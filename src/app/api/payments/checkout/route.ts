import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Plan } from "@/models/Plan";
import { Order } from "@/models/Order";
import { createLiveInvoice } from "@/lib/oxapay";
import { ok, fail, serialize } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return fail("unauthorized", 401);

  try {
    const body = await req.json();
    const planSlug = String(body.planSlug ?? "");
    if (!planSlug) return fail("missing_fields");

    await connectDB();
    const plan = await Plan.findOne({ slug: planSlug, active: true });
    if (!plan) return fail("plan_not_found", 404);

    const order = await Order.create({
      user: user._id,
      planSlug: plan.slug,
      amountUsd: plan.priceUsd,
      provider: "oxapay-live",
      trackId: "pending",
    });

    const invoice = await createLiveInvoice(
      String(order._id),
      plan.priceUsd,
      `${req.nextUrl.origin}/dashboard/plans`
    );
    order.provider = invoice.provider;
    order.trackId = invoice.trackId;
    order.payLink = invoice.payLink;
    await order.save();

    return ok({ order: serialize(order) });
  } catch (e) {
    console.error("checkout error", e);
    if (e instanceof Error && e.message === "oxapay_live_api_key_missing") {
      return fail("oxapay_live_api_key_missing", 503);
    }
    return fail("server_error", 500);
  }
}
