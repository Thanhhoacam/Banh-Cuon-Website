"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";

import { Order, OrderItem, FirestoreOrder, Food, FirestoreFood } from "@/types";

export default function PendingOrdersView() {
  const qc = useQueryClient();
  const [filterTable, setFilterTable] = useState<number | "">("");
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<{
    tableNumber: number;
    orders: Order[];
    totalAmount: number;
    status: string;
    createdAt: number;
    _id: string;
  } | null>(null);

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

  const { data: orders = [] } = useQuery({
    queryKey: ["orders", "pending"],
    queryFn: async () => {
      const snap = await getDocs(collection(db, "orders"));
      const allOrders = snap.docs.map((d) => ({
        _id: d.id,
        ...(d.data() as FirestoreOrder),
      })) as Order[];

      // Show each order as separate card, only show unpaid and non-cancelled orders
      const unpaidOrders = allOrders.filter(
        (o) => o.status !== "paid" && o.status !== "cancelled"
      );

      // Each order becomes a separate card
      const groupedOrders = unpaidOrders.reduce(
        (acc, order) => {
          const orderKey = order._id; // Use order ID as unique key

          acc[orderKey] = {
            tableNumber: order.tableNumber,
            orders: [order], // Single order per card
            totalAmount: order.total,
            status: order.status,
            createdAt: order.createdAt,
            _id: order._id,
          };

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

      return Object.values(groupedOrders).sort((a, b) => {
        // Sắp xếp theo thời gian tạo đơn hàng (cũ nhất trước)
        const timeA = a.createdAt || 0;
        const timeB = b.createdAt || 0;
        return timeA - timeB;
      });
    },
  });

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, () =>
      qc.invalidateQueries({ queryKey: ["orders", "pending"] })
    );
    return () => unsub();
  }, [qc]);

  const updateStatus = useMutation({
    mutationFn: async (payload: { id: string; status: Order["status"] }) => {
      // Tìm tất cả đơn hàng của bàn này và cập nhật status
      const allOrders = await getDocs(collection(db, "orders"));
      const tableOrders = allOrders.docs
        .map((d) => ({ _id: d.id, ...(d.data() as FirestoreOrder) }))
        .filter((o) => o._id === payload.id);

      // Cập nhật tất cả đơn hàng của bàn này
      const updatePromises = tableOrders.map((order) =>
        updateDoc(doc(db, "orders", order._id), {
          status: payload.status,
        })
      );

      await Promise.all(updatePromises);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders", "pending"] }),
  });

  const makePayment = useMutation({
    mutationFn: async (orderId: string) => {
      // Tìm tất cả đơn hàng của bàn này
      const allOrders = await getDocs(collection(db, "orders"));
      const tableOrders = allOrders.docs
        .map((d) => ({ _id: d.id, ...(d.data() as FirestoreOrder) }))
        .filter((o) => o._id === orderId);

      if (tableOrders.length === 0) return;

      const tableNumber = tableOrders[0].tableNumber;

      // Tìm tất cả đơn hàng chưa thanh toán của bàn này
      const allTableOrders = allOrders.docs
        .map((d) => ({ _id: d.id, ...(d.data() as FirestoreOrder) }))
        .filter((o) => o.tableNumber === tableNumber && o.status !== "paid");

      // Gộp tất cả items từ các đơn hàng của bàn
      const allItems = allTableOrders.flatMap((order) => order.items);
      const groupedItems = allItems.reduce((acc, item) => {
        const existingItem = acc.find((i) => i.food === item.food);
        if (existingItem) {
          existingItem.quantity += item.quantity;
        } else {
          acc.push({ ...item });
        }
        return acc;
      }, [] as OrderItem[]);

      // Tính tổng tiền
      const totalAmount = groupedItems.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
      );

      // Tạo payment record
      await addDoc(collection(db, "payments"), {
        tableNumber,
        items: groupedItems,
        totalAmount,
        status: "paid",
        createdAt: Date.now(),
        orderIds: allTableOrders.map((o) => o._id),
      });

      // Cập nhật tất cả đơn hàng của bàn thành "paid"
      const updatePromises = allTableOrders.map((order) =>
        updateDoc(doc(db, "orders", order._id), { status: "paid" })
      );

      await Promise.all(updatePromises);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders", "pending"] });
      setShowPaymentConfirm(false);
      setSelectedOrder(null);
    },
  });

  const handlePaymentClick = (order: {
    tableNumber: number;
    orders: Order[];
    totalAmount: number;
    status: string;
    createdAt: number;
    _id: string;
  }) => {
    // Tìm tất cả đơn hàng của cùng bàn
    const allTableOrders = orders.filter(
      (o) => o.tableNumber === order.tableNumber
    );
    const totalAmount = allTableOrders.reduce(
      (sum, o) => sum + o.totalAmount,
      0
    );

    setSelectedOrder({
      ...order,
      orders: allTableOrders.flatMap((o) => o.orders),
      totalAmount: totalAmount,
    });
    setShowPaymentConfirm(true);
  };

  const confirmPayment = () => {
    if (selectedOrder) {
      makePayment.mutate(selectedOrder._id);
    }
  };

  const cancelOrder = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: "cancelled" }),
      });
      if (!response.ok) throw new Error("Failed to cancel order");
      return response.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders", "pending"] }),
  });

  const filtered = orders.filter((o) =>
    filterTable === "" ? true : o.tableNumber === filterTable
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
            ⏳ Đơn hàng chưa thanh toán
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Quản lý đơn hàng đang chờ xử lý
          </p>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">
              🔍 Lọc đơn hàng
            </h2>
            <div className="flex items-center gap-2 sm:gap-3 bg-green-100 px-3 sm:px-4 py-2 rounded-full">
              <span className="text-xs sm:text-sm font-medium text-green-800">
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
                className="w-16 sm:w-20 text-center font-bold text-green-700 bg-green-50 border border-green-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-green-300 text-xs sm:text-sm"
                placeholder="Tất cả"
              />
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-3 sm:space-y-4">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center">
              <div className="text-4xl sm:text-6xl mb-4">🍽️</div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
                Không có đơn hàng nào
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Chưa có đơn hàng nào phù hợp với bộ lọc
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
                    <div className="bg-green-100 text-green-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                      Bàn {tableOrder.tableNumber} -{" "}
                      {tableOrder.createdAt
                        ? new Date(
                            tableOrder.createdAt * 1000
                          ).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </div>
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">
                      {tableOrder.totalAmount.toLocaleString()} đ
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-xs sm:text-sm text-gray-500 mb-1">
                      Trạng thái
                    </div>
                    <span
                      className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                        tableOrder.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : tableOrder.status === "preparing"
                          ? "bg-yellow-100 text-yellow-800"
                          : tableOrder.status === "done"
                          ? "bg-blue-100 text-blue-800"
                          : tableOrder.status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {tableOrder.status === "paid"
                        ? "✅ Hoàn thành"
                        : tableOrder.status === "preparing"
                        ? "👨‍🍳 Đang chuẩn bị"
                        : tableOrder.status === "done"
                        ? "🍽️ Đã xong"
                        : tableOrder.status === "cancelled"
                        ? "❌ Đã hủy"
                        : "⏳ Chờ xác nhận"}
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
                      ));
                    })()}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  {tableOrder.status !== "preparing" &&
                    tableOrder.status !== "done" && (
                      <button
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium flex items-center justify-center gap-2 text-xs sm:text-sm"
                        onClick={() =>
                          updateStatus.mutate({
                            id: tableOrder._id,
                            status: "preparing",
                          })
                        }
                      >
                        👨‍🍳 Bắt đầu làm
                      </button>
                    )}
                  {tableOrder.status !== "done" && (
                    <button
                      className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center justify-center gap-2 text-xs sm:text-sm"
                      onClick={() =>
                        updateStatus.mutate({
                          id: tableOrder._id,
                          status: "done",
                        })
                      }
                    >
                      ✅ Đã hoàn thành
                    </button>
                  )}
                  {tableOrder.status !== "paid" && (
                    <button
                      className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center justify-center gap-2 text-xs sm:text-sm"
                      onClick={() => handlePaymentClick(tableOrder)}
                    >
                      💳 Tính tiền
                    </button>
                  )}
                  {tableOrder.status !== "paid" &&
                    tableOrder.status !== "cancelled" && (
                      <button
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center justify-center gap-2 text-xs sm:text-sm"
                        onClick={() => cancelOrder.mutate(tableOrder._id)}
                        disabled={cancelOrder.isPending}
                      >
                        ❌ Hủy đơn hàng
                      </button>
                    )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Payment Confirmation Dialog */}
      {showPaymentConfirm && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
                💳 Xác nhận thanh toán
              </h3>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-800">Bàn số:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {selectedOrder.tableNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800">
                      Tổng tiền:
                    </span>
                    <span className="text-2xl font-bold text-green-600">
                      {selectedOrder.totalAmount.toLocaleString()} đ
                    </span>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">
                    Chi tiết đơn hàng:
                  </h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {selectedOrder.orders
                      .flatMap((order: Order) => order.items)
                      .map((item: OrderItem, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {foods.find((f) => f._id === item.food)?.name ||
                              `Món ID: ${item.food}`}{" "}
                            x{item.quantity}
                          </span>
                          <span className="font-medium text-gray-800">
                            {(item.quantity * item.price).toLocaleString()} đ
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                  onClick={() => {
                    setShowPaymentConfirm(false);
                    setSelectedOrder(null);
                  }}
                  disabled={makePayment.isPending}
                >
                  Hủy bỏ
                </button>
                <button
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                  onClick={confirmPayment}
                  disabled={makePayment.isPending}
                >
                  {makePayment.isPending
                    ? "Đang xử lý..."
                    : "Xác nhận thanh toán"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
