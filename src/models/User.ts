import mongoose, { Schema, Model, models, Types } from "mongoose";

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: "user" | "admin";
  referralCode: string;
  referredBy: Types.ObjectId | null;
  klcBalance: number;
  totalMined: number;
  totalReferralEarnings: number;
  totalBonus: number;
  language: "fr" | "en";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    referralCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    referredBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    klcBalance: { type: Number, default: 0 },
    totalMined: { type: Number, default: 0 },
    totalReferralEarnings: { type: Number, default: 0 },
    totalBonus: { type: Number, default: 0 },
    language: { type: String, enum: ["fr", "en"], default: "fr" },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  (models.User as Model<IUser>) || mongoose.model<IUser>("User", UserSchema);
