/**
 * Seeds the KLAUN-EC database: the 11 membership plans from the whitepaper
 * plus an admin account. Safe to re-run (upserts).
 *
 * Usage: node scripts/seed.mjs
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const envPath = join(root, ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/klaunec";

const PLANS = [
  { slug: "starter",  name: "STARTER",  priceUsd: 10,   durationMonths: 2,  dailyKlc: 0.1,  referralRates: { g1: 5,    g2: 2,   g3: 1    }, order: 1 },
  { slug: "bronze",   name: "BRONZE",   priceUsd: 25,   durationMonths: 3,  dailyKlc: 0.25, referralRates: { g1: 5.5,  g2: 2,   g3: 1    }, order: 2 },
  { slug: "silver",   name: "SILVER",   priceUsd: 50,   durationMonths: 3,  dailyKlc: 0.5,  referralRates: { g1: 6,    g2: 2,   g3: 1    }, order: 3 },
  { slug: "gold",     name: "GOLD",     priceUsd: 100,  durationMonths: 6,  dailyKlc: 1,    referralRates: { g1: 7,    g2: 2.5, g3: 1.25 }, order: 4 },
  { slug: "platinum", name: "PLATINUM", priceUsd: 250,  durationMonths: 6,  dailyKlc: 2.5,  referralRates: { g1: 8,    g2: 2.5, g3: 1.25 }, order: 5 },
  { slug: "diamond",  name: "DIAMOND",  priceUsd: 500,  durationMonths: 9,  dailyKlc: 5,    referralRates: { g1: 9,    g2: 3,   g3: 1.5  }, order: 6 },
  { slug: "hub-1000", name: "HUB 1000", priceUsd: 1000, durationMonths: 9,  dailyKlc: 10,   referralRates: { g1: 10,   g2: 3,   g3: 1.5  }, order: 7 },
  { slug: "hub-1200", name: "HUB 1200", priceUsd: 1200, durationMonths: 12, dailyKlc: 12,   referralRates: { g1: 10.5, g2: 3,   g3: 1.5  }, order: 8 },
  { slug: "hub-1500", name: "HUB 1500", priceUsd: 1500, durationMonths: 12, dailyKlc: 15,   referralRates: { g1: 11,   g2: 3.5, g3: 1.75 }, order: 9 },
  { slug: "hub-1800", name: "HUB 1800", priceUsd: 1800, durationMonths: 12, dailyKlc: 18,   referralRates: { g1: 12,   g2: 3.5, g3: 1.75 }, order: 10 },
  { slug: "hub-2000", name: "HUB 2000", priceUsd: 2000, durationMonths: 12, dailyKlc: 20,   referralRates: { g1: 12.5, g2: 4,   g3: 2    }, order: 11 },
];

const PlanSchema = new mongoose.Schema(
  {
    slug: { type: String, unique: true },
    name: String,
    priceUsd: Number,
    durationMonths: Number,
    dailyKlc: Number,
    referralRates: { g1: Number, g2: Number, g3: Number },
    order: Number,
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
    passwordHash: String,
    role: { type: String, enum: ["user", "admin"], default: "user" },
    referralCode: { type: String, unique: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    klcBalance: { type: Number, default: 0 },
    totalMined: { type: Number, default: 0 },
    totalReferralEarnings: { type: Number, default: 0 },
    totalBonus: { type: Number, default: 0 },
    language: { type: String, default: "fr" },
  },
  { timestamps: true }
);

const Plan = mongoose.models.Plan || mongoose.model("Plan", PlanSchema);
const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function main() {
  console.log("Connecting to", MONGODB_URI);
  await mongoose.connect(MONGODB_URI);

  for (const p of PLANS) {
    await Plan.updateOne({ slug: p.slug }, { $set: p }, { upsert: true });
  }
  console.log(`Seeded ${PLANS.length} plans.`);

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@klaunec.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";
  const existing = await User.findOne({ email: adminEmail });
  if (!existing) {
    await User.create({
      name: "Administrateur",
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: "admin",
      referralCode: "ADMIN001",
    });
    console.log(`Admin created: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log(`Admin already exists: ${adminEmail}`);
  }

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
