import { requireUser } from "@/lib/auth";
import { creditMiningForUser } from "@/lib/mining";
import { ok, fail } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await requireUser();
  if (!user) return fail("unauthorized", 401);

  const result = await creditMiningForUser(user._id);
  return ok(result);
}
