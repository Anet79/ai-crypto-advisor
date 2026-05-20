import mongoose, { Document, Schema } from "mongoose";

export interface IPreference extends Document {
  userId: mongoose.Types.ObjectId;
  coins: string[];
  investorType: string;
  contentTypes: string[];
}

const preferenceSchema = new Schema<IPreference>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    coins: {
      type: [String],
      required: true,
      default: [],
    },

    investorType: {
      type: String,
      required: true,
    },

    contentTypes: {
      type: [String],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Preference = mongoose.model<IPreference>(
  "Preference",
  preferenceSchema
);