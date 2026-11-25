import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { isLiveInvoicePaid } from "@/lib/oxapay";
import { purchaseMembership, PurchaseError } from "@/lib/commissions";
import { ok, fail, serialize } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Confirms a live payment and activates the membership (idempotent).
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (!user) return fail("unauthorized", 401);

  try {
    const { id } = await params;
    await connectDB();
    const order = await Order.findOne({ _id: id, user: user._id });
    if (!order) return fail("order_not_found", 404);
    if (order.status === "paid") return ok({ order: serialize(order), alreadyPaid: true });

    if (order.provider !== "oxapay-live") {
      return fail("legacy_sandbox_order", 400);
    }
    const paid = await isLiveInvoicePaid(order.trackId);
    if (!paid) return ok({ order: serialize(order), paid: false });

    // atomic pending -> paid so a double click can't activate two memberships
    const claimed = await Order.findOneAndUpdate(
      { _id: order._id, status: "pending" },
      { status: "paid" },
      { new: true }
    );
    if (!claimed) return ok({ order: serialize(order), alreadyPaid: true });

    const membership = await purchaseMembership(user._id, order.planSlug);
    return ok({ order: serialize(claimed), membership: serialize(membership), paid: true });
  } catch (e) {
    if (e instanceof PurchaseError) return fail(e.message, 400);
    console.error("confirm error", e);
    return fail("server_error", 500);
  }
}
