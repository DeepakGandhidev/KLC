import { getSessionUser, publicUser } from "@/lib/auth";
import { creditMiningForUser } from "@/lib/mining";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { ok, fail } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return fail("unauthorized", 401);

  // lazy daily mining credit on session fetch
  const credit = await creditMiningForUser(session._id);

  await connectDB();
  const fresh = await User.findById(session._id);
  if (!fresh) return fail("unauthorized", 401);

  return ok({ user: publicUser(fresh), miningCredited: credit.credited });
}
