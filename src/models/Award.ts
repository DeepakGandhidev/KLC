import mongoose, { Schema, Model, models, Types } from "mongoose";

export type AwardRank = "SAPPHIRE" | "EMERALD" | "RUBY" | "DIAMOND" | "CROWN";

export interface IAward {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  rank: AwardRank;
  achievedAt: Date;
  qualifyingVolume: number; // USD volume of qualifying memberships
  bonusKlc: number;
  mentorBonusKlc: number; // paid to direct sponsor
  createdAt: Date;
  updatedAt: Date;
}

const AwardSchema = new Schema<IAward>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rank: {
      type: String,
      enum: ["SAPPHIRE", "EMERALD", "RUBY", "DIAMOND", "CROWN"],
      required: true,
    },
    achievedAt: { type: Date, required: true },
    qualifyingVolume: { type: Number, required: true },
    bonusKlc: { type: Number, required: true },
    mentorBonusKlc: { type: Number, default: 0 },
  },
  { timestamps: true }
);

AwardSchema.index({ user: 1, rank: 1 }, { unique: true });

export const Award: Model<IAward> =
  (models.Award as Model<IAward>) || mongoose.model<IAward>("Award", AwardSchema);
