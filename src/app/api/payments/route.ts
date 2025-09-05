import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, addDoc, collection } from "firebase/firestore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, method = "cash" } = body as {
      orderId: string;
      method?: string;
    };

    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const orderData = orderSnap.data();

    // Create payment record
    const paymentData = {
      orderId: orderId,
      tableNumber: orderData.tableNumber,
      amount: orderData.total,
      method,
      status: "paid",
      createdAt: new Date(),
    };

    const paymentRef = await addDoc(collection(db, "payments"), paymentData);

    // Update order status to paid
    await updateDoc(orderRef, { status: "paid" });

    return NextResponse.json(
      { _id: paymentRef.id, ...paymentData },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 }
    );
  }
}
