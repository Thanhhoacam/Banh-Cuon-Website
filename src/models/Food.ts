import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const FoodSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: String, enum: ["food", "drink"], default: "food" },
    imageUrl: { type: String },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type FoodDocument = InferSchemaType<typeof FoodSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Food: Model<FoodDocument> =
  mongoose.models.Food || mongoose.model<FoodDocument>("Food", FoodSchema);
