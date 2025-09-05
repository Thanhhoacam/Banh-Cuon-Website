import { NextResponse } from "next/server";
import { connectMongo } from "@/mongodb";
import { Order } from "@/models/Order";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  await connectMongo();
  const doc = await Order.findById(params.id).lean();
  if (!doc) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json(doc);
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connectMongo();
  const body = await req.json();
  const updated = await Order.findByIdAndUpdate(params.id, body, { new: true });
  if (!updated)
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  if (global.io) {
    global.io.emit("order:update", updated);
    global.io.to(`table:${updated.tableNumber}`).emit("order:update", updated);
  }
  return NextResponse.json(updated);
}
