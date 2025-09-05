"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { format } from "date-fns";

import { OrderItem, Payment, Food, FirestoreFood } from "@/types";

export default function PaidOrdersView() {
  const qc = useQueryClient();
  const [filterTable, setFilterTable] = useState<number | "">("");

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

  const { data: payments = [] } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const snap = await getDocs(collection(db, "payments"));
      return snap.docs.map((d) => ({
        _id: d.id,
        ...d.data(),
      })) as Payment[];
    },
  });

  useEffect(() => {
    const q = query(collection(db, "payments"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, () =>
      qc.invalidateQueries({ queryKey: ["payments"] })
    );
    return () => unsub();
  }, [qc]);

  const filtered = payments.filter((p) =>
    filterTable === "" ? true : p.tableNumber === filterTable
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
            ✅ Đơn hàng đã thanh toán
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Lịch sử đơn hàng đã hoàn thành
          </p>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">
              🔍 Lọc đơn hàng
            </h2>
            <div className="flex items-center gap-2 sm:gap-3 bg-blue-100 px-3 sm:px-4 py-2 rounded-full">
              <span className="text-xs sm:text-sm font-medium text-blue-800">
                Bàn số:
              </span>
              <input
                type="number"
                min={1}
                value={filterTable}
                onChange={(e) =>
                  setFilterTable(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                className="w-16 sm:w-20 text-center font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-300 text-xs sm:text-sm"
                placeholder="Tất cả"
              />
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-3 sm:space-y-4">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center">
              <div className="text-4xl sm:text-6xl mb-4">💰</div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
                Không có đơn hàng đã thanh toán
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Chưa có đơn hàng nào đã hoàn thành thanh toán
              </p>
            </div>
          ) : (
            filtered.map((payment) => (
              <div
                key={payment._id}
                className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-200 hover:shadow-xl transition-all duration-200"
              >
                {/* Payment Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <div className="bg-green-100 text-green-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                      Bàn {payment.tableNumber}
                    </div>
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">
                      {(payment.totalAmount || 0).toLocaleString()} đ
                    </div>
                    <div className="bg-green-100 text-green-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                      ✅ Đã thanh toán
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-xs sm:text-sm text-gray-500 mb-1">
                      Thời gian
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-gray-800">
                      {(() => {
                        try {
                          const date = payment.createdAt
                            ? new Date(payment.createdAt)
                            : new Date();
                          return format(date, "HH:mm - dd/MM/yyyy");
                        } catch {
                          return format(new Date(), "HH:mm - dd/MM/yyyy");
                        }
                      })()}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">
                    📋 Chi tiết đơn hàng
                  </h4>
                  <div className="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-2">
                    {(payment.items || []).map((i: OrderItem, idx: number) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center py-1 sm:py-2 border-b border-gray-200 last:border-b-0"
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="text-xs sm:text-sm text-gray-500">
                            {foods.find((f) => f._id === i.food)?.name ||
                              `food?`}
                          </span>
                          <span className="font-medium text-gray-800 text-sm sm:text-base">
                            x{i.quantity}
                          </span>
                        </div>
                        <span className="font-semibold text-green-600 text-sm sm:text-base">
                          {(i.quantity * i.price).toLocaleString()} đ
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-green-50 rounded-lg p-3 sm:p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-base sm:text-lg font-semibold text-gray-800">
                      Tổng thanh toán:
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-green-600">
                      {(payment.totalAmount || 0).toLocaleString()} đ
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
