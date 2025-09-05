import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const PaymentSchema = new Schema(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    tableNumber: { type: Number, required: true },
    amount: { type: Number, required: true },
    method: {
      type: String,
      enum: ["cash", "card", "momo", "zalo"],
      default: "cash",
    },
    status: { type: String, enum: ["pending", "paid"], default: "paid" },
  },
  { timestamps: true }
);

export type PaymentDocument = InferSchemaType<typeof PaymentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Payment: Model<PaymentDocument> =
  mongoose.models.Payment ||
  mongoose.model<PaymentDocument>("Payment", PaymentSchema);
