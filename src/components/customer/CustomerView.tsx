"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  onSnapshot,
  addDoc,
  query,
  orderBy,
} from "firebase/firestore";

import { Food, Order, OrderItem, FirestoreFood, FirestoreOrder } from "@/types";

export default function CustomerView() {
  const qc = useQueryClient();
  const [tableNumber, setTableNumber] = useState<number>(1);
  const [cart, setCart] = useState<Record<string, number>>({});

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

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, q]) => q > 0)
        .map(([id, q]) => ({ id, q, food: foods.find((f) => f._id === id)! })),
    [cart, foods]
  );

  const total = cartItems.reduce((s, i) => s + i.q * (i.food?.price ?? 0), 0);

  const placeOrder = useMutation({
    mutationFn: async () => {
      const items: OrderItem[] = cartItems.map((i) => ({
        food: i.id,
        quantity: i.q,
        price: i.food?.price ?? 0,
      }));
      const total = items.reduce((s, i) => s + i.quantity * i.price, 0);
      const ref = await addDoc(collection(db, "orders"), {
        tableNumber,
        items,
        status: "pending",
        total,
        createdAt: Date.now(),
      });
      return { _id: ref.id, tableNumber, status: "pending", total } as Order;
    },
    onSuccess: () => {
      setCart({});
      qc.invalidateQueries({ queryKey: ["orders", tableNumber] });
    },
  });

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, () => {
      qc.invalidateQueries({ queryKey: ["orders", tableNumber] });
    });
    return () => unsub();
  }, [qc, tableNumber]);

  const { data: myOrders = [] } = useQuery({
    queryKey: ["orders", tableNumber],
    queryFn: async () => {
      const snap = await getDocs(collection(db, "orders"));
      return snap.docs
        .map((d) => ({ _id: d.id, ...(d.data() as FirestoreOrder) }))
        .filter((o) => o.tableNumber === tableNumber) as Order[];
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🍽️ Food Order
          </h1>
          <p className="text-gray-600">Đặt món ngon, giao hàng nhanh</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Menu Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  📋 Menu Món Ăn
                </h2>
                <div className="flex items-center gap-3 bg-orange-100 px-4 py-2 rounded-full">
                  <span className="text-sm font-medium text-orange-800">
                    Bàn số:
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={tableNumber}
                    onChange={(e) =>
                      setTableNumber(Number(e.target.value || 1))
                    }
                    className="w-16 text-center font-bold text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {foods.map((f) => (
                  <div
                    key={f._id}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 hover:border-orange-300"
                  >
                    <div className="flex gap-4">
                      {f.imageUrl && (
                        <Image
                          src={f.imageUrl}
                          alt={f.name}
                          width={80}
                          height={80}
                          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 text-lg mb-1">
                          {f.name}
                        </h3>
                        <p className="text-orange-600 font-bold text-xl mb-3">
                          {f.price.toLocaleString()} đ
                        </p>
                        <div className="flex items-center gap-3">
                          <button
                            className="w-8 h-8 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors flex items-center justify-center"
                            onClick={() =>
                              setCart((c) => ({
                                ...c,
                                [f._id]: (c[f._id] || 0) + 1,
                              }))
                            }
                          >
                            +
                          </button>
                          <span className="w-8 text-center font-semibold text-gray-700">
                            {cart[f._id] || 0}
                          </span>
                          <button
                            className="w-8 h-8 bg-gray-300 text-gray-700 rounded-full hover:bg-gray-400 transition-colors flex items-center justify-center"
                            onClick={() =>
                              setCart((c) => ({
                                ...c,
                                [f._id]: Math.max(0, (c[f._id] || 0) - 1),
                              }))
                            }
                          >
                            -
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cart & Orders Section */}
          <div className="lg:col-span-1 space-y-6">
            {/* Cart */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                🛒 Giỏ hàng
                {cartItems.length > 0 && (
                  <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                    {cartItems.length}
                  </span>
                )}
              </h2>

              {cartItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Giỏ hàng trống</p>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((i) => (
                    <div
                      key={i.id}
                      className="flex justify-between items-center py-2 border-b border-gray-100"
                    >
                      <div className="flex-1">
                        <span className="font-medium text-gray-800">
                          {i.food?.name}
                        </span>
                        <span className="text-gray-500 text-sm ml-2">
                          x{i.q}
                        </span>
                      </div>
                      <span className="font-semibold text-orange-600">
                        {(i.q * (i.food?.price ?? 0)).toLocaleString()} đ
                      </span>
                    </div>
                  ))}

                  <div className="flex justify-between items-center pt-4 border-t-2 border-orange-200">
                    <span className="text-lg font-bold text-gray-800">
                      Tổng cộng
                    </span>
                    <span className="text-2xl font-bold text-orange-600">
                      {total.toLocaleString()} đ
                    </span>
                  </div>

                  <button
                    disabled={placeOrder.isPending || cartItems.length === 0}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 px-6 rounded-xl hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                    onClick={() => placeOrder.mutate()}
                  >
                    {placeOrder.isPending ? "Đang gửi..." : "🚀 Gửi đơn hàng"}
                  </button>
                </div>
              )}
            </div>

            {/* Order Status */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                📋 Trạng thái đơn hàng
              </h2>

              {myOrders.filter((o) => o.tableNumber === tableNumber).length ===
              0 ? (
                <p className="text-gray-500 text-center py-8">
                  Chưa có đơn hàng nào
                </p>
              ) : (
                <div className="space-y-3">
                  {myOrders
                    .filter((o) => o.tableNumber === tableNumber)
                    .map((o) => (
                      <div
                        key={o._id}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-gray-800">
                            Đơn #{o._id.slice(-5)}
                          </span>
                          <span className="text-sm text-gray-500">
                            Bàn {o.tableNumber}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Trạng thái:
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              o.status === "paid"
                                ? "bg-green-100 text-green-800"
                                : o.status === "preparing"
                                ? "bg-yellow-100 text-yellow-800"
                                : o.status === "done"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {o.status === "paid"
                              ? "✅ Hoàn thành"
                              : o.status === "preparing"
                              ? "👨‍🍳 Đang chuẩn bị"
                              : o.status === "done"
                              ? "🍽️ Đã xong"
                              : "⏳ Chờ xác nhận"}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
