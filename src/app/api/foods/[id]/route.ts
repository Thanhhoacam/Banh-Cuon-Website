import { NextResponse } from "next/server";
import { connectMongo } from "@/mongodb";
import { Food } from "@/models/Food";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  await connectMongo();
  const doc = await Food.findById(params.id).lean();
  if (!doc) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json(doc);
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connectMongo();
  const body = await req.json();
  const updated = await Food.findByIdAndUpdate(params.id, body, { new: true });
  if (!updated)
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  await connectMongo();
  const res = await Food.findByIdAndDelete(params.id);
  if (!res) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
