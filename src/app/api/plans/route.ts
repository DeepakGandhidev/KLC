import { connectDB } from "@/lib/mongodb";
import { Plan } from "@/models/Plan";
import { ok, serialize } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  await connectDB();
  const plans = await Plan.find({ active: true }).sort({ order: 1 }).lean();
  return ok({ plans: serialize(plans) });
}
