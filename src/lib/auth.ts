import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User, IUser } from "@/models/User";

const JWT_SECRET =
  process.env.JWT_SECRET || "klaunec_dev_only_secret_change_in_production";
const TOKEN_COOKIE = "klaunec_token";
const TOKEN_MAX_AGE_S = 7 * 24 * 60 * 60; // 7 days

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: TOKEN_MAX_AGE_S });
}

export function verifyToken(token: string): { sub: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (typeof payload === "object" && payload && "sub" in payload) {
      return { sub: String((payload as jwt.JwtPayload).sub) };
    }
    return null;
  } catch {
    return null;
  }
}

export async function setAuthCookie(userId: string): Promise<void> {
  const store = await cookies();
  store.set(TOKEN_COOKIE, signToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: TOKEN_MAX_AGE_S,
    path: "/",
  });
}

export async function clearAuthCookie(): Promise<void> {
  const store = await cookies();
  store.delete(TOKEN_COOKIE);
}

/** Returns the logged-in user document, or null. */
export async function getSessionUser(): Promise<IUser | null> {
  const store = await cookies();
  const token = store.get(TOKEN_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  await connectDB();
  const user = await User.findById(payload.sub);
  return user;
}

export async function requireUser(): Promise<IUser | null> {
  return getSessionUser();
}

export async function requireAdmin(): Promise<IUser | null> {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

export function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/** Serialisable shape sent to the client. */
export function publicUser(u: IUser) {
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role,
    referralCode: u.referralCode,
    referredBy: u.referredBy ? String(u.referredBy) : null,
    klcBalance: u.klcBalance,
    totalMined: u.totalMined,
    totalReferralEarnings: u.totalReferralEarnings,
    totalBonus: u.totalBonus,
    language: u.language,
    createdAt: u.createdAt,
  };
}
