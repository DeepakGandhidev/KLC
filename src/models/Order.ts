import mongoose, { Schema, Model, models, Types } from "mongoose";

export interface IOrder {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  planSlug: string;
  amountUsd: number;
  provider: "oxapay-live" | "oxapay-sandbox" | "local-sandbox";
  trackId: string;
  payLink: string;
  status: "pending" | "paid" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    planSlug: { type: String, required: true },
    amountUsd: { type: Number, required: true },
    provider: { type: String, enum: ["oxapay-live", "oxapay-sandbox", "local-sandbox"], required: true },
    trackId: { type: String, required: true },
    payLink: { type: String, default: "" },
    status: { type: String, enum: ["pending", "paid", "failed"], default: "pending", index: true },
  },
  { timestamps: true }
);

export const Order: Model<IOrder> =
  (models.Order as Model<IOrder>) || mongoose.model<IOrder>("Order", OrderSchema);
