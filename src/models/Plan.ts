import mongoose, { Schema, Model, models, Types } from "mongoose";

export interface IPlan {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  priceUsd: number;
  durationMonths: number;
  dailyKlc: number;
  referralRates: { g1: number; g2: number; g3: number };
  order: number;
  active: boolean;
}

const PlanSchema = new Schema<IPlan>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    priceUsd: { type: Number, required: true },
    durationMonths: { type: Number, required: true },
    dailyKlc: { type: Number, required: true },
    referralRates: {
      g1: { type: Number, required: true },
      g2: { type: Number, required: true },
      g3: { type: Number, required: true },
    },
    order: { type: Number, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Plan: Model<IPlan> =
  (models.Plan as Model<IPlan>) || mongoose.model<IPlan>("Plan", PlanSchema);
