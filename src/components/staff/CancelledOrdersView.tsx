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

import { Order, OrderItem, FirestoreOrder } from "@/types";

export default function CancelledOrdersView() {
  const qc = useQueryClient();
  const [filterTable, setFilterTable] = useState<number | "">("");

  const { data: orders = [] } = useQuery({
    queryKey: ["orders", "cancelled"],
    queryFn: async () => {
      const snap = await getDocs(collection(db, "orders"));
      const allOrders = snap.docs.map((d) => ({
        _id: d.id,
        ...(d.data() as FirestoreOrder),
      })) as Order[];

      // Group orders by table number, only show cancelled orders
      const cancelledOrders = allOrders.filter((o) => o.status === "cancelled");
      const groupedOrders = cancelledOrders.reduce(
        (acc, order) => {
          const tableKey = order.tableNumber.toString();
          if (!acc[tableKey]) {
            acc[tableKey] = {
              tableNumber: order.tableNumber,
              orders: [],
              totalAmount: 0,
              status: order.status,
              createdAt: order.createdAt,
              _id: order._id,
            };
          }
          acc[tableKey].orders.push(order);
          acc[tableKey].totalAmount += order.total;
          return acc;
        },
        {} as Record<
          string,
          {
            tableNumber: number;
            orders: Order[];
            totalAmount: number;
            status: string;
            createdAt: number;
            _id: string;
          }
        >
      );

      return Object.values(groupedOrders);
    },
  });

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, () =>
      qc.invalidateQueries({ queryKey: ["orders", "cancelled"] })
    );
    return () => unsub();
  }, [qc]);

  const filtered = orders.filter((o) =>
    filterTable === "" ? true : o.tableNumber === filterTable
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
            ❌ Đơn hàng đã hủy
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Lịch sử đơn hàng đã bị hủy
          </p>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">
              🔍 Lọc đơn hàng
            </h2>
            <div className="flex items-center gap-2 sm:gap-3 bg-red-100 px-3 sm:px-4 py-2 rounded-full">
              <span className="text-xs sm:text-sm font-medium text-red-800">
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
                className="w-16 sm:w-20 text-center font-bold text-red-700 bg-red-50 border border-red-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-red-300 text-xs sm:text-sm"
                placeholder="Tất cả"
              />
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-3 sm:space-y-4">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center">
              <div className="text-4xl sm:text-6xl mb-4">🚫</div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
                Không có đơn hàng đã hủy
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Chưa có đơn hàng nào bị hủy
              </p>
            </div>
          ) : (
            filtered.map((tableOrder) => (
              <div
                key={tableOrder._id}
                className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-200 hover:shadow-xl transition-all duration-200"
              >
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <div className="bg-red-100 text-red-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                      Bàn {tableOrder.tableNumber}
                    </div>
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">
                      {tableOrder.totalAmount.toLocaleString()} đ
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-xs sm:text-sm text-gray-500 mb-1">
                      Trạng thái
                    </div>
                    <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-red-100 text-red-800">
                      ❌ Đã hủy
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">
                    📋 Chi tiết đơn hàng
                  </h4>
                  <div className="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-2">
                    {(() => {
                      // Gộp tất cả items từ các đơn hàng của bàn này
                      const allItems = tableOrder.orders.flatMap(
                        (order) => order.items
                      );
                      const groupedItems = allItems.reduce((acc, item) => {
                        const existingItem = acc.find(
                          (i) => i.food === item.food
                        );
                        if (existingItem) {
                          existingItem.quantity += item.quantity;
                        } else {
                          acc.push({ ...item });
                        }
                        return acc;
                      }, [] as OrderItem[]);

                      return groupedItems.map((i, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center py-1 sm:py-2 border-b border-gray-200 last:border-b-0"
                        >
                          <div className="flex items-center gap-2 sm:gap-3">
                            <span className="text-xs sm:text-sm text-gray-500">
                              #{i.food.slice(-5)}
                            </span>
                            <span className="font-medium text-gray-800 text-sm sm:text-base">
                              x{i.quantity}
                            </span>
                          </div>
                          <span className="font-semibold text-red-600 text-sm sm:text-base">
                            {(i.quantity * i.price).toLocaleString()} đ
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-red-50 rounded-lg p-3 sm:p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-base sm:text-lg font-semibold text-gray-800">
                      Tổng tiền đã hủy:
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-red-600">
                      {tableOrder.totalAmount.toLocaleString()} đ
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
