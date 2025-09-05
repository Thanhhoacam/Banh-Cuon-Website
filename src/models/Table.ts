import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const TableSchema = new Schema(
  {
    number: { type: Number, required: true, unique: true },
    isOccupied: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type TableDocument = InferSchemaType<typeof TableSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Table: Model<TableDocument> =
  mongoose.models.Table || mongoose.model<TableDocument>("Table", TableSchema);
