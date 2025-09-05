import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";

export async function GET() {
  try {
    const foodsSnapshot = await getDocs(collection(db, "foods"));
    const foods = foodsSnapshot.docs.map((doc) => ({
      _id: doc.id,
      ...doc.data(),
    }));
    return NextResponse.json(foods);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch foods" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const docRef = await addDoc(collection(db, "foods"), body);
    return NextResponse.json({ _id: docRef.id, ...body }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create food" },
      { status: 500 }
    );
  }
}
