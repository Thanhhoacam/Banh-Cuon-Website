"use client";

import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { FirestorePayment, StatsResponse } from "@/types";

export default function StatsView() {
  const { data: stats } = useQuery<StatsResponse>({
    queryKey: ["stats"],
    queryFn: async () => {
      // Query payments for revenue statistics
      const payments = await getDocs(collection(db, "payments"));
      const byDate = new Map<string, number>();
      const byWeekday = new Map<number, number>();
      let totalRevenue = 0;
      let totalOrders = 0;

      payments.forEach((p) => {
        const d = p.data() as FirestorePayment;
        const date = new Date(d.createdAt ?? Date.now());
        const dateStr = date.toISOString().slice(0, 10);
        const weekday = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

        const amount = d.totalAmount ?? 0;
        byDate.set(dateStr, (byDate.get(dateStr) ?? 0) + amount);
        byWeekday.set(weekday, (byWeekday.get(weekday) ?? 0) + 1);

        totalRevenue += amount;
        totalOrders += 1;
      });

      return {
        daily: Array.from(byDate.entries()).map(([k, v]) => ({
          _id: k,
          revenue: v,
        })),
        weeklyAvg: Array.from(byWeekday.entries()).map(([k, v]) => ({
          _id: k,
          avgCount: v,
        })),
        totalRevenue,
        totalOrders,
      };
    },
  });

  const daily = (stats?.daily || []).map((d) => ({
    date: d._id,
    revenue: d.revenue,
  }));

  return (
    <div className="p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          📊 Thống kê doanh thu
        </h1>
        <p className="text-gray-600">
          Phân tích doanh thu và hiệu suất kinh doanh
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-full">
              <span className="text-2xl">💰</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng doanh thu</p>
              <p className="text-2xl font-bold text-gray-800">
                {(stats?.totalRevenue || 0).toLocaleString()} đ
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <span className="text-2xl">📈</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng số bàn đã thanh toán</p>
              <p className="text-2xl font-bold text-gray-800">
                {stats?.totalOrders || 0} bàn
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-full">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Doanh thu trung bình/bàn</p>
              <p className="text-2xl font-bold text-gray-800">
                {stats && stats.totalOrders > 0
                  ? Math.round(
                      (stats.totalRevenue || 0) / stats.totalOrders
                    ).toLocaleString() + " đ"
                  : "0 đ"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          📈 Biểu đồ doanh thu theo ngày
        </h2>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "#f9fafb",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
