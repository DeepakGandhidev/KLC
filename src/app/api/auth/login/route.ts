import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { publicUser, setAuthCookie, verifyPassword } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) return fail("missing_fields");

    await connectDB();
    const user = await User.findOne({ email });
    if (!user) return fail("invalid_credentials", 401);

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return fail("invalid_credentials", 401);

    await setAuthCookie(String(user._id));
    return ok({ user: publicUser(user) });
  } catch (e) {
    console.error("login error", e);
    return fail("server_error", 500);
  }
}
