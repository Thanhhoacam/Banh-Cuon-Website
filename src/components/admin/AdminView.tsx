"use client";

import { useState } from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Food, FirestoreFood, FirestorePayment, StatsResponse } from "@/types";

export default function AdminView() {
  const qc = useQueryClient();
  const { data: foods = [] } = useQuery({
    queryKey: ["foods"],
    queryFn: async () => {
      const snap = await getDocs(collection(db, "foods"));
      return snap.docs.map((d) => ({
        _id: d.id,
        ...(d.data() as FirestoreFood),
      })) as Food[];
    },
  });
  const { data: stats } = useQuery<StatsResponse>({
    queryKey: ["stats"],
    queryFn: async () => {
      // simple compute from payments; for production use Cloud Functions pre-aggregation
      const payments = await getDocs(collection(db, "payments"));
      const byDate = new Map<string, number>();
      payments.forEach((p) => {
        const d = p.data() as FirestorePayment;
        const date = new Date(d.createdAt ?? Date.now())
          .toISOString()
          .slice(0, 10);
        byDate.set(date, (byDate.get(date) ?? 0) + (d.totalAmount ?? 0));
      });
      const totalRevenue = Array.from(byDate.values()).reduce(
        (sum, v) => sum + v,
        0
      );
      const totalOrders = payments.size;

      return {
        daily: Array.from(byDate.entries()).map(([k, v]) => ({
          _id: k,
          revenue: v,
        })),
        totalRevenue,
        totalOrders,
      };
    },
  });

  const [editing, setEditing] = useState<Partial<Food>>({});
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const data = await response.json();
    return data.url;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const imageUrl = await uploadImage(file);
      setEditing({ ...editing, imageUrl });
    } catch (error) {
      console.error("Upload error:", error);
      alert("Lỗi upload ảnh");
    } finally {
      setUploading(false);
    }
  };

  const createFood = useMutation({
    mutationFn: async (f: Partial<Food>) => {
      await addDoc(collection(db, "foods"), f);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["foods"] }),
  });
  const updateFood = useMutation({
    mutationFn: async (f: Partial<Food>) => {
      await updateDoc(doc(db, "foods", String(f._id)), {
        name: f.name,
        price: f.price,
        isAvailable: (f as Food).isAvailable ?? true,
        imageUrl: f.imageUrl,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["foods"] }),
  });
  const deleteFood = useMutation({
    mutationFn: async (id: string) => deleteDoc(doc(db, "foods", id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["foods"] }),
  });

  const daily = (stats?.daily || []).map((d) => ({
    date: d._id,
    revenue: d.revenue,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            👨‍💼 Admin Dashboard
          </h1>
          <p className="text-gray-600">Quản lý món ăn và thống kê doanh thu</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Food Management */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
              🍽️ Quản lý món ăn
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {foods.map((f) => (
                <div
                  key={f._id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    {f.imageUrl && (
                      <Image
                        src={f.imageUrl}
                        alt={f.name}
                        width={64}
                        height={64}
                        className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 text-base sm:text-lg">
                        {f.name}
                      </div>
                      <div className="text-orange-600 font-bold text-lg sm:text-xl">
                        {f.price.toLocaleString()} đ
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">
                        {f.isAvailable ? "✅ Có sẵn" : "❌ Hết hàng"}
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        className="flex-1 sm:flex-none px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs sm:text-sm font-medium"
                        onClick={() => setEditing(f)}
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        className="flex-1 sm:flex-none px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs sm:text-sm font-medium"
                        onClick={() => deleteFood.mutate(f._id)}
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                {editing._id ? "✏️ Sửa món ăn" : "➕ Thêm món ăn mới"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên món ăn
                  </label>
                  <input
                    className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900 placeholder-gray-500"
                    placeholder="Nhập tên món ăn..."
                    value={editing.name || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá (VNĐ)
                  </label>
                  <input
                    className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900 placeholder-gray-500"
                    placeholder="Nhập giá món ăn..."
                    type="number"
                    value={editing.price ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, price: Number(e.target.value) })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ảnh món ăn
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {uploading && (
                    <p className="text-sm text-blue-600 mt-2 flex items-center gap-2">
                      <span className="animate-spin">⏳</span> Đang upload
                      ảnh...
                    </p>
                  )}
                  {editing.imageUrl && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">Preview:</p>
                      <Image
                        src={editing.imageUrl}
                        alt="Preview"
                        width={96}
                        height={96}
                        className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 px-6 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg"
                    onClick={() =>
                      editing._id
                        ? updateFood.mutate(editing)
                        : createFood.mutate(editing)
                    }
                  >
                    {editing._id ? "💾 Cập nhật món" : "✨ Tạo món mới"}
                  </button>
                  <button
                    className="px-6 py-3 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 transition-all duration-200"
                    onClick={() => setEditing({})}
                  >
                    🔄 Reset
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              📊 Thống kê doanh thu
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

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  📈 Biểu đồ doanh thu theo ngày
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
