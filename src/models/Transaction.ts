import mongoose, { Schema, Model, models, Types } from "mongoose";

export type TransactionType =
  | "purchase"
  | "mining"
  | "referral_g1"
  | "referral_g2"
  | "referral_g3"
  | "renewal_bonus"
  | "award"
  | "mentor_bonus"
  | "withdrawal"
  | "withdrawal_fee"
  | "withdrawal_refund"
  | "adjustment";

export interface ITransaction {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  type: TransactionType;
  amount: number; // signed, in KLC
  balanceAfter: number;
  description: string;
  meta: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: [
        "purchase",
        "mining",
        "referral_g1",
        "referral_g2",
        "referral_g3",
        "renewal_bonus",
        "award",
        "mentor_bonus",
        "withdrawal",
        "withdrawal_fee",
        "withdrawal_refund",
        "adjustment",
      ],
      required: true,
    },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    description: { type: String, default: "" },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

TransactionSchema.index({ user: 1, createdAt: -1 });

export const Transaction: Model<ITransaction> =
  (models.Transaction as Model<ITransaction>) ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);
