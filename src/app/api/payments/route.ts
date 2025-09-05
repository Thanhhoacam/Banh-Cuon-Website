import { NextResponse } from "next/server";
import { connectMongo } from "@/mongodb";
import { Payment } from "@/models/Payment";
import { Order } from "@/models/Order";

export async function POST(request: Request) {
  await connectMongo();
  const body = await request.json();
  const { orderId, method = "cash" } = body as {
    orderId: string;
    method?: string;
  };

  const order = await Order.findById(orderId);
  if (!order)
    return NextResponse.json({ message: "Order not found" }, { status: 404 });

  const payment = await Payment.create({
    order: order._id,
    tableNumber: order.tableNumber,
    amount: order.total,
    method,
    status: "paid",
  });

  order.status = "paid";
  await order.save();

  return NextResponse.json(payment, { status: 201 });
}
