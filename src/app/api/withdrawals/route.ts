import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Withdrawal } from "@/models/Withdrawal";
import { Transaction } from "@/models/Transaction";
import { creditMiningForUser } from "@/lib/mining";
import { WITHDRAWAL_FEE_RATE, round4 } from "@/lib/plans";
import { ok, fail, serialize } from "@/lib/api";

export const dynamic = "force-dynamic";

const MIN_WITHDRAWAL_KLC = 10;

export async function GET() {
  const user = await requireUser();
  if (!user) return fail("unauthorized", 401);

  await connectDB();
  const withdrawals = await Withdrawal.find({ user: user._id })
    .sort({ createdAt: -1 })
    .lean();
  return ok({ withdrawals: serialize(withdrawals) });
}

export async function POST(req: NextRequest) {
  const session = await requireUser();
  if (!session) return fail("unauthorized", 401);

  try {
    const body = await req.json();
    const amount = Number(body.amountKlc);
    const destination = String(body.destination ?? "").trim();

    if (!Number.isFinite(amount) || amount <= 0) return fail("invalid_amount");
    if (amount < MIN_WITHDRAWAL_KLC) return fail("amount_below_minimum");
    if (!destination) return fail("missing_destination");

    // credit any pending mining first so the balance is accurate
    await creditMiningForUser(session._id);

    await connectDB();
    const user = await User.findById(session._id);
    if (!user) return fail("unauthorized", 401);

    if (user.klcBalance < amount) return fail("insufficient_balance");

    const gross = round4(amount);
    const fee = round4((gross * WITHDRAWAL_FEE_RATE) / 100);
    const net = round4(gross - fee);

    const withdrawal = await Withdrawal.create({
      user: user._id,
      amountKlc: gross,
      feeKlc: fee,
      netKlc: net,
      destination,
    });

    // ledger: net leaves the balance, then the fee
    user.klcBalance = round4(user.klcBalance - net);
    await Transaction.create({
      user: user._id,
      type: "withdrawal",
      amount: -net,
      balanceAfter: user.klcBalance,
      description: `Retrait de ${net} KLC (net)`,
      meta: { withdrawalId: String(withdrawal._id), gross, fee, net },
    });

    user.klcBalance = round4(user.klcBalance - fee);
    await Transaction.create({
      user: user._id,
      type: "withdrawal_fee",
      amount: -fee,
      balanceAfter: user.klcBalance,
      description: `Frais de retrait (${WITHDRAWAL_FEE_RATE} %)`,
      meta: { withdrawalId: String(withdrawal._id) },
    });

    await user.save();

    return ok({
      withdrawal: serialize(withdrawal.toObject()),
      balance: user.klcBalance,
    });
  } catch (e) {
    console.error("withdrawal error", e);
    return fail("server_error", 500);
  }
}
