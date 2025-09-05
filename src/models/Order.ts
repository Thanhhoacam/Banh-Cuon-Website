import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const OrderItemSchema = new Schema(
  {
    food: { type: Schema.Types.ObjectId, ref: "Food", required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    tableNumber: { type: Number, required: true },
    items: { type: [OrderItemSchema], required: true },
    status: {
      type: String,
      enum: ["pending", "preparing", "done", "paid", "cancelled"],
      default: "pending",
    },
    note: { type: String },
    total: { type: Number, required: true },
  },
  { timestamps: true }
);

export type OrderDocument = InferSchemaType<typeof OrderSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Order: Model<OrderDocument> =
  mongoose.models.Order || mongoose.model<OrderDocument>("Order", OrderSchema);
