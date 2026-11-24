import { requireUser } from "@/lib/auth";
import { getAwardProgress } from "@/lib/commissions";
import { ok, fail } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();
  if (!user) return fail("unauthorized", 401);

  const progress = await getAwardProgress(user._id);
  return ok({ tiers: progress });
}
