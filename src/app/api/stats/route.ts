import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export async function GET() {
  try {
    // Get all orders for stats
    const ordersSnapshot = await getDocs(
      query(collection(db, "orders"), orderBy("createdAt", "desc"))
    );
    const orders = ordersSnapshot.docs.map((doc) => ({
      _id: doc.id,
      ...doc.data(),
    }));

    // Calculate daily stats
    const dailyStats = orders.reduce(
      (
        acc: Record<string, { revenue: number; count: number }>,
        order: unknown
      ) => {
        const orderData = order as {
          status: string;
          createdAt: { seconds: number };
          total: number;
        };
        if (orderData.status === "paid" && orderData.createdAt) {
          const date = new Date(orderData.createdAt.seconds * 1000)
            .toISOString()
            .split("T")[0];
          if (!acc[date]) {
            acc[date] = { revenue: 0, count: 0 };
          }
          acc[date].revenue += orderData.total || 0;
          acc[date].count += 1;
        }
        return acc;
      },
      {}
    );

    const daily = Object.entries(dailyStats)
      .map(([date, stats]: [string, { revenue: number; count: number }]) => ({
        _id: date,
        revenue: stats.revenue,
        count: stats.count,
      }))
      .sort((a, b) => a._id.localeCompare(b._id));

    // Simple weekly average (placeholder)
    const weeklyAvg = [
      { _id: 1, avgCount: 0 },
      { _id: 2, avgCount: 0 },
      { _id: 3, avgCount: 0 },
      { _id: 4, avgCount: 0 },
      { _id: 5, avgCount: 0 },
      { _id: 6, avgCount: 0 },
      { _id: 7, avgCount: 0 },
    ];

    return NextResponse.json({ daily, weeklyAvg });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
