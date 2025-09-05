import { NextResponse } from "next/server";
import { connectMongo } from "@/mongodb";
import { Order } from "@/models/Order";
import { Food } from "@/models/Food";

export async function GET() {
  await connectMongo();
  const orders = await Order.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  await connectMongo();
  const body = await request.json();
  const items = body.items as { food: string; quantity: number }[];

  const foods = await Food.find({ _id: { $in: items.map((i) => i.food) } });
  const priceById = new Map(foods.map((f) => [f._id.toString(), f.price]));
  const enriched = items.map((i) => ({
    food: i.food,
    quantity: i.quantity,
    price: priceById.get(i.food) ?? 0,
  }));
  const total = enriched.reduce((s, i) => s + i.quantity * i.price, 0);

  const created = await Order.create({
    tableNumber: body.tableNumber,
    items: enriched,
    note: body.note,
    total,
    status: "pending",
  });
  if (global.io) {
    global.io.emit("order:new", created);
    global.io.to(`table:${created.tableNumber}`).emit("order:update", created);
  }
  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(request: Request) {
  await connectMongo();
  const body = await request.json();
  const { orderId, status } = body;

  if (!orderId || !status) {
    return NextResponse.json(
      { error: "Missing orderId or status" },
      { status: 400 }
    );
  }

  if (status === "cancelled") {
    // Cancel all orders for this table
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update all orders for this table to cancelled
    const result = await Order.updateMany(
      {
        tableNumber: order.tableNumber,
        status: { $in: ["pending", "preparing"] },
      },
      { status: "cancelled" }
    );

    if (global.io) {
      global.io.emit("order:cancelled", { tableNumber: order.tableNumber });
      global.io
        .to(`table:${order.tableNumber}`)
        .emit("order:update", { status: "cancelled" });
    }

    return NextResponse.json({
      message: "Orders cancelled successfully",
      cancelledCount: result.modifiedCount,
    });
  }

  // For other status updates
  const updatedOrder = await Order.findByIdAndUpdate(
    orderId,
    { status },
    { new: true }
  );

  if (!updatedOrder) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (global.io) {
    global.io.emit("order:update", updatedOrder);
    global.io
      .to(`table:${updatedOrder.tableNumber}`)
      .emit("order:update", updatedOrder);
  }

  return NextResponse.json(updatedOrder);
}
