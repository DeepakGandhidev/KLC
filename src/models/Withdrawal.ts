import mongoose, { Schema, Model, models, Types } from "mongoose";

export interface IWithdrawal {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  amountKlc: number;
  feeKlc: number;
  netKlc: number;
  destination: string;
  status: "pending" | "approved" | "rejected";
  processedBy: Types.ObjectId | null;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const WithdrawalSchema = new Schema<IWithdrawal>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amountKlc: { type: Number, required: true },
    feeKlc: { type: Number, required: true },
    netKlc: { type: Number, required: true },
    destination: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    processedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Withdrawal: Model<IWithdrawal> =
  (models.Withdrawal as Model<IWithdrawal>) ||
  mongoose.model<IWithdrawal>("Withdrawal", WithdrawalSchema);
