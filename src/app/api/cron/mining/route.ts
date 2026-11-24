import { NextRequest } from "next/server";
import { creditMiningForAllUsers } from "@/lib/mining";
import { ok, fail } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Cron endpoint for daily mining credit.
 * Call with: Authorization: Bearer <CRON_SECRET>  (or ?secret=<CRON_SECRET>)
 * e.g. from a system crontab hitting the deployed app once a day.
 */
async function handle(req: NextRequest) {
  const secret =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    req.nextUrl.searchParams.get("secret");
  const expected = process.env.CRON_SECRET || "klaunec_cron_secret_dev";

  if (secret !== expected) return fail("unauthorized", 401);

  const result = await creditMiningForAllUsers();
  return ok(result);
}

export const GET = handle;
export const POST = handle;
