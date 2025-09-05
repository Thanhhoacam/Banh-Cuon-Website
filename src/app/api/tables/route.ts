import { NextResponse } from "next/server";
import { connectMongo } from "@/mongodb";
import { Table } from "@/models/Table";

export async function GET() {
  await connectMongo();
  const tables = await Table.find().lean();
  return NextResponse.json(tables);
}

export async function POST(request: Request) {
  await connectMongo();
  const body = await request.json();
  const created = await Table.create(body);
  return NextResponse.json(created, { status: 201 });
}
