import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";

export async function GET() {
  try {
    const ordersSnapshot = await getDocs(
      query(collection(db, "orders"), orderBy("createdAt", "desc"))
    );
    const orders = ordersSnapshot.docs.map((doc) => ({
      _id: doc.id,
      ...doc.data(),
    }));
    return NextResponse.json(orders);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items = body.items as {
      food: string;
      quantity: number;
      price: number;
    }[];

    // Calculate total from items (prices should already be included)
    const total = items.reduce((s, i) => s + i.quantity * i.price, 0);

    const orderData = {
      tableNumber: body.tableNumber,
      items: items,
      note: body.note || "",
      total,
      status: "pending",
      createdAt: new Date(),
    };

    const docRef = await addDoc(collection(db, "orders"), orderData);
    const created = { _id: docRef.id, ...orderData };

    if (global.io) {
      global.io.emit("order:new", created);
      global.io
        .to(`table:${created.tableNumber}`)
        .emit("order:update", created);
    }
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Missing orderId or status" },
        { status: 400 }
      );
    }

    const orderRef = doc(db, "orders", orderId);

    if (status === "cancelled") {
      // For cancellation, we'll update the specific order
      await updateDoc(orderRef, { status: "cancelled" });

      if (global.io) {
        global.io.emit("order:cancelled", { orderId });
        global.io.emit("order:update", { _id: orderId, status: "cancelled" });
      }

      return NextResponse.json({
        message: "Order cancelled successfully",
        orderId: orderId,
      });
    }

    // For other status updates
    await updateDoc(orderRef, { status });
    const updatedOrder = { _id: orderId, status };

    if (global.io) {
      global.io.emit("order:update", updatedOrder);
    }

    return NextResponse.json(updatedOrder);
  } catch {
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
