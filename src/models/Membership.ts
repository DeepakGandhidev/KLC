import mongoose, { Schema, Model, models, Types } from "mongoose";

export interface IMembership {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  plan: Types.ObjectId;
  planName: string;
  priceUsd: number;
  dailyKlc: number;
  startDate: Date;
  endDate: Date;
  status: "active" | "expired" | "cancelled";
  lastCreditedAt: Date;
  totalMined: number;
  isRenewal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MembershipSchema = new Schema<IMembership>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    plan: { type: Schema.Types.ObjectId, ref: "Plan", required: true },
    planName: { type: String, required: true },
    priceUsd: { type: Number, required: true },
    dailyKlc: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
      index: true,
    },
    lastCreditedAt: { type: Date, required: true },
    totalMined: { type: Number, default: 0 },
    isRenewal: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Membership: Model<IMembership> =
  (models.Membership as Model<IMembership>) ||
  mongoose.model<IMembership>("Membership", MembershipSchema);
