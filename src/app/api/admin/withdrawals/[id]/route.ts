import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Withdrawal } from "@/models/Withdrawal";
import { Transaction } from "@/models/Transaction";
import { ok, fail, serialize } from "@/lib/api";
import { round4 } from "@/lib/plans";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return fail("unauthorized", 403);

  const { id } = await params;
  const body = await req.json();
  const action = String(body.action ?? "");

  if (action !== "approve" && action !== "reject") return fail("invalid_action");

  await connectDB();

  const withdrawal = await Withdrawal.findById(id);
  if (!withdrawal) return fail("not_found", 404);
  if (withdrawal.status !== "pending") return fail("already_processed", 409);

  if (action === "approve") {
    withdrawal.status = "approved";
  } else {
    // rejected: refund the gross amount to the user's balance
    withdrawal.status = "rejected";
    const user = await User.findById(withdrawal.user);
    if (user) {
      user.klcBalance = round4(user.klcBalance + withdrawal.amountKlc);
      await user.save();
      await Transaction.create({
        user: user._id,
        type: "withdrawal_refund",
        amount: withdrawal.amountKlc,
        balanceAfter: user.klcBalance,
        description: `Remboursement du retrait ${withdrawal.amountKlc} KLC`,
        meta: { withdrawalId: String(withdrawal._id) },
      });
    }
  }

  withdrawal.processedBy = admin._id;
  withdrawal.processedAt = new Date();
  await withdrawal.save();

  return ok({ withdrawal: serialize(withdrawal.toObject()) });
}
