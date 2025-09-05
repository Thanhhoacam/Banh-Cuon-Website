import { NextResponse } from "next/server";
import { connectMongo } from "@/mongodb";
import { Payment } from "@/models/Payment";

export async function GET() {
  await connectMongo();

  const daily = await Payment.aggregate([
    {
      $group: {
        _id: { $dateToString: { date: "$createdAt", format: "%Y-%m-%d" } },
        revenue: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const weeklyAvg = await Payment.aggregate([
    {
      $group: {
        _id: { $isoDayOfWeek: "$createdAt" },
        avgCount: { $avg: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return NextResponse.json({ daily, weeklyAvg });
}
