import { NextResponse } from "next/server";
import { connectMongo } from "@/mongodb";
import { Food } from "@/models/Food";

export async function GET() {
  await connectMongo();
  const foods = await Food.find().lean();
  return NextResponse.json(foods);
}

export async function POST(request: Request) {
  await connectMongo();
  const body = await request.json();
  const created = await Food.create(body);
  return NextResponse.json(created, { status: 201 });
}
