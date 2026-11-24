import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import {
  generateReferralCode,
  hashPassword,
  publicUser,
  setAuthCookie,
} from "@/lib/auth";
import { ok, fail } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const referralCode = String(body.referralCode ?? "").trim().toUpperCase();
    const language = body.language === "en" ? "en" : "fr";

    if (!name || !email || !password) return fail("missing_fields");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("invalid_email");
    if (password.length < 6) return fail("password_too_short");

    await connectDB();

    const existing = await User.findOne({ email });
    if (existing) return fail("email_exists", 409);

    let referredBy = null;
    if (referralCode) {
      const sponsor = await User.findOne({ referralCode });
      if (!sponsor) return fail("referral_invalid");
      referredBy = sponsor._id;
    }

    let code = generateReferralCode();
    // referral code collisions are unlikely but possible — retry a few times
    for (let i = 0; i < 5; i++) {
      const clash = await User.findOne({ referralCode: code });
      if (!clash) break;
      code = generateReferralCode();
    }

    const user = await User.create({
      name,
      email,
      passwordHash: await hashPassword(password),
      referralCode: code,
      referredBy,
      language,
    });

    await setAuthCookie(String(user._id));
    return ok({ user: publicUser(user) });
  } catch (e) {
    console.error("register error", e);
    return fail("server_error", 500);
  }
}
