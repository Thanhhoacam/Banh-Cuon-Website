import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";

export async function GET() {
  try {
    const tablesSnapshot = await getDocs(collection(db, "tables"));
    const tables = tablesSnapshot.docs.map((doc) => ({
      _id: doc.id,
      ...doc.data(),
    }));
    return NextResponse.json(tables);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch tables" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const docRef = await addDoc(collection(db, "tables"), body);
    return NextResponse.json({ _id: docRef.id, ...body }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create table" },
      { status: 500 }
    );
  }
}
