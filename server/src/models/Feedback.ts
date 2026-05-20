import mongoose, { Document, Schema } from "mongoose";

export interface IFeedback extends Document {
  userId: mongoose.Types.ObjectId;
  section: "news" | "prices" | "insight" | "meme";
  itemId?: string;
  value: "like" | "dislike";
}

const feedbackSchema = new Schema<IFeedback>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    section: {
      type: String,
      enum: ["news", "prices", "insight", "meme"],
      required: true,
    },

    itemId: {
      type: String,
      required: false,
    },

    value: {
      type: String,
      enum: ["like", "dislike"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Feedback = mongoose.model<IFeedback>(
  "Feedback",
  feedbackSchema
);