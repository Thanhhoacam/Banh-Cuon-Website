"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Plus,
  Minus,
  Clock,
  CheckCircle,
  ChefHat,
  Utensils,
  ChevronDown,
  X,
  Settings,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/firebase";
import { collection, getDocs, onSnapshot, addDoc } from "firebase/firestore";
import { Food, Order, OrderItem, FirestoreFood, FirestoreOrder } from "@/types";
import { format } from "date-fns";

export default function ModernCustomerView() {
  const qc = useQueryClient();
  const [tableNumber, setTableNumber] = useState(0);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

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

  const { data: allOrders = [] } = useQuery({
    queryKey: ["orders", "all"],
    queryFn: async () => {
      const snap = await getDocs(collection(db, "orders"));
      return snap.docs.map((d) => ({
        _id: d.id,
        ...(d.data() as FirestoreOrder),
      })) as Order[];
    },
  });

  const myOrders = useMemo(() => {
    return allOrders.filter((o) => o.tableNumber === tableNumber);
  }, [allOrders, tableNumber]);

  useEffect(() => {
    const q = collection(db, "orders");
    const unsub = onSnapshot(q, () => {
      qc.invalidateQueries({ queryKey: ["orders", "all"] });
    });
    return () => unsub();
  }, [qc]);

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .filter(([, q]) => q > 0)
      .map(([foodId, q]) => ({
        id: foodId,
        q,
        food: foods.find((f) => f._id === foodId),
      }))
      .filter((i) => i.food);
  }, [cart, foods]);

  const total = useMemo(
    () => cartItems.reduce((sum, i) => sum + i.q * (i.food?.price ?? 0), 0),
    [cartItems]
  );

  const placeOrder = useMutation({
    mutationFn: async () => {
      if (tableNumber === 0) {
        toast.error(
          "Bạn đang ngồi bàn số mấy? Vui lòng chọn số bàn trước khi đặt món!"
        );
        throw new Error("Table number is required");
      }

      const items: OrderItem[] = cartItems.map((i) => ({
        food: i.food!._id,
        quantity: i.q,
        price: i.food!.price,
      }));

      // Luôn tạo đơn hàng mới cho mỗi lần đặt món
      await addDoc(collection(db, "orders"), {
        tableNumber,
        items,
        total,
        status: "pending",
        createdAt: new Date(),
      });

      setCart({});
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders", "my"] }),
  });

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders", "my"] });
      setShowCancelConfirm(false);
      toast.success("Đã hủy đơn hàng!");
    },
    onError: () => {
      toast.error("Không thể hủy đơn hàng!");
    },
  });

  const handleCancelOrder = () => {
    setShowCancelConfirm(true);
  };

  const confirmCancelOrder = () => {
    const activeOrder = myOrders.find(
      (o) => o.status !== "paid" && o.status !== "cancelled"
    );
    if (activeOrder) {
      cancelOrder.mutate(activeOrder._id);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "preparing":
        return <ChefHat className="h-4 w-4 text-yellow-600" />;
      case "done":
        return <Utensils className="h-4 w-4 text-blue-600" />;
      case "cancelled":
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "✅ Hoàn thành";
      case "preparing":
        return "👨‍🍳 Đang chuẩn bị";
      case "done":
        return "🍽️ Đã xong";
      case "cancelled":
        return "❌ Đã hủy";
      default:
        return "⏳ Chờ xác nhận";
    }
  };

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
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold text-gray-800 mb-2 hover:text-orange-600 transition-colors duration-300 cursor-pointer">
              <Image
                src="/default-food.png"
                alt="Bánh Cuốn Cậu Cả"
                width={100}
                height={100}
                className="w-10 h-10 object-cover rounded-lg flex-shrink-0 inline-block mr-3"
              />
              Bánh Cuốn Cậu Cả
            </h1>
          </Link>
        </motion.div>

        <div
          className={`grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 ${
            isCartExpanded ? "pb-50" : "pb-0"
          }`}
        >
          {/* Menu Section */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <Card className="mb-16">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <ChefHat className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                    Menu Món Ăn
                  </CardTitle>
                  <div className="flex items-center gap-3 bg-orange-100 px-3 sm:px-4 py-2 rounded-full">
                    <span className="text-xs sm:text-sm font-medium text-orange-800">
                      Bàn số:
                    </span>
                    <Input
                      type="number"
                      min={0}
                      value={tableNumber}
                      onChange={(e) =>
                        setTableNumber(Number(e.target.value || 0))
                      }
                      className="w-12 sm:w-16 text-center font-bold text-orange-700 bg-orange-50 border-orange-200 focus:ring-orange-300 text-sm"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-orange-300 scrollbar-track-orange-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-3">
                    {foods.map((f, index) => (
                      <motion.div
                        key={f._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                      >
                        <Card className="hover:shadow-lg transition-all duration-200 hover:border-orange-300 p-3 m-2">
                          <CardContent className="p-2 sm:p-3">
                            <div className="flex gap-2 sm:gap-3">
                              <Image
                                src={f.imageUrl || "/default-food.png"}
                                alt={f.name}
                                width={50}
                                height={50}
                                className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                  <h3 className="font-semibold text-gray-800 text-sm sm:text-lg leading-tight">
                                    {f.name}
                                  </h3>
                                  <p className="text-orange-600 font-bold text-sm sm:text-xl ml-2">
                                    {f.price.toLocaleString()} đ
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-6 h-6 sm:w-8 sm:h-8 p-0 rounded-full"
                                    onClick={() =>
                                      setCart((c) => ({
                                        ...c,
                                        [f._id]: Math.max(
                                          0,
                                          (c[f._id] || 0) - 1
                                        ),
                                      }))
                                    }
                                  >
                                    <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </Button>
                                  <span className="w-6 sm:w-8 text-center font-semibold text-gray-700 text-sm sm:text-base">
                                    {cart[f._id] || 0}
                                  </span>
                                  <Button
                                    size="sm"
                                    className="w-6 h-6 sm:w-8 sm:h-8 p-0 rounded-full bg-orange-500 hover:bg-orange-600"
                                    onClick={() => {
                                      if (tableNumber === 0) {
                                        toast.error(
                                          "Vui lòng chọn số bàn trước khi thêm món!"
                                        );
                                        return;
                                      }
                                      setCart((c) => ({
                                        ...c,
                                        [f._id]: (c[f._id] || 0) + 1,
                                      }));
                                    }}
                                  >
                                    <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders Section */}
          <div className="lg:col-span-1 space-y-6 order-1 lg:order-2">
            {/* Pending Orders - Special Section */}
            {myOrders.filter((o) => o.status === "pending").length > 0 && (
              <Card className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-800">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    Đơn hàng chờ xác nhận
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {myOrders
                    .filter((o) => o.status === "pending")
                    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
                    .map((o) => (
                      <motion.div
                        key={o._id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="bg-white rounded-lg p-4 border border-yellow-200">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-800">
                                Đơn bàn số{" "}
                                <span className="font-bold text-orange-600 text-lg">
                                  {o.tableNumber}
                                </span>
                              </h3>
                              <div className="text-sm text-gray-600 mt-1">
                                <p className="font-medium mb-1">Đã đặt:</p>
                                <div className="space-y-1">
                                  {o.items.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between text-xs"
                                    >
                                      <span>
                                        {foods.find((f) => f._id === item.food)
                                          ?.name || `Món ID: ${item.food}`}
                                      </span>
                                      <span className="font-medium">
                                        x{item.quantity}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <p className="text-xs text-orange-600 mt-1 font-medium">
                                Lượt chờ:{" "}
                                {(() => {
                                  try {
                                    // Đếm số đơn hàng pending từ tất cả bàn được tạo trước đơn này
                                    const pendingOrders = allOrders.filter(
                                      (order) => order.status === "pending"
                                    );
                                    const currentOrderTime = o.createdAt || 0;

                                    const ordersAhead = pendingOrders.filter(
                                      (order) => {
                                        const orderTime = order.createdAt || 0;
                                        return orderTime < currentOrderTime;
                                      }
                                    ).length;

                                    return ordersAhead;
                                  } catch {
                                    return 0;
                                  }
                                })()}{" "}
                                đơn
                              </p>
                            </div>
                            <Badge className="bg-yellow-100 text-yellow-800">
                              ⏳ Chờ xác nhận
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">
                              {o.createdAt
                                ? new Date(o.createdAt * 1000).toLocaleString(
                                    "vi-VN",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )
                                : ""}
                            </span>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={handleCancelOrder}
                              disabled={cancelOrder.isPending}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              {cancelOrder.isPending
                                ? "Đang hủy..."
                                : "❌ Hủy đơn hàng"}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </CardContent>
              </Card>
            )}

            {/* Order Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Trạng thái đơn hàng
                </CardTitle>
              </CardHeader>
              <CardContent>
                {myOrders.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Chưa có đơn hàng nào
                  </p>
                ) : (
                  <div className="space-y-3">
                    {myOrders
                      .filter(
                        (o) =>
                          o.status !== "paid" &&
                          o.status !== "cancelled" &&
                          o.status !== "pending"
                      )
                      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
                      .map((o) => (
                        <motion.div
                          key={o._id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Card className="bg-gray-50 border-gray-200">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-gray-800">
                                  Đơn bàn số{" "}
                                  <span className="font-bold text-orange-600 text-lg">
                                    {o.tableNumber}
                                  </span>
                                </span>
                                {/* <span className="text-sm text-gray-500">
                                  #{o._id.slice(-5)}
                                </span> */}
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">
                                  Trạng thái:
                                </span>
                                <Badge
                                  variant={
                                    o.status === "paid"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className={`flex items-center gap-1 ${
                                    o.status === "paid"
                                      ? "bg-green-100 text-green-800"
                                      : o.status === "preparing"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : o.status === "done"
                                      ? "bg-blue-100 text-blue-800"
                                      : o.status === "cancelled"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {getStatusIcon(o.status)}
                                  {getStatusText(o.status)}
                                </Badge>
                              </div>
                              <div className="mt-2 flex justify-between items-center">
                                <div className="text-sm text-gray-500">
                                  {(() => {
                                    try {
                                      const date = o.createdAt
                                        ? new Date(o.createdAt)
                                        : new Date();
                                      return format(date, "HH:mm");
                                    } catch {
                                      return format(new Date(), "HH:mm");
                                    }
                                  })()}
                                </div>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 px-2 text-xs"
                                  onClick={handleCancelOrder}
                                  disabled={cancelOrder.isPending}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Hủy đơn
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Admin Button - Left side */}
        <motion.div
          className="fixed right-0 top-1/2 transform -translate-y-1/2 z-50"
          initial={{ scale: 0, x: -50 }}
          animate={{ scale: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <Link href="/admin/orders">
            <Button
              size="lg"
              className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-2xl border-2 border-white"
              title="Quản lý đơn hàng"
            >
              <Settings className="h-6 w-6 text-white" />
            </Button>
          </Link>
        </motion.div>

        {/* Floating Cart Button */}
        <motion.div
          className="fixed bottom-2 left-1/2 transform -translate-x-1/2 z-50 lg:hidden"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <Button
            size="lg"
            className="w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-2xl border-2 border-white"
            onClick={() => setIsCartExpanded(!isCartExpanded)}
          >
            <div className="relative">
              <ShoppingCart className="h-6 w-6 text-white" />
              {cartItems.length > 0 && (
                <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs bg-red-500 text-white border-2 border-white">
                  {cartItems.length}
                </Badge>
              )}
            </div>
          </Button>
        </motion.div>

        {/* Floating Cart Panel */}
        {isCartExpanded && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <Card className="mx-4 mb-4 shadow-2xl border-2 border-orange-200 max-h-80 overflow-y-auto">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ShoppingCart className="h-5 w-5 text-orange-600" />
                    Giỏ hàng
                    {cartItems.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-orange-100 text-orange-700"
                      >
                        {cartItems.length}
                      </Badge>
                    )}
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-8 h-8 p-0 rounded-full"
                    onClick={() => setIsCartExpanded(false)}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {cartItems.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Giỏ hàng trống
                  </p>
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

                    <Button
                      disabled={placeOrder.isPending || cartItems.length === 0}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                      onClick={() => placeOrder.mutate()}
                    >
                      {placeOrder.isPending ? "Đang gửi..." : "🚀 Gửi đơn hàng"}
                    </Button>

                    {/* Cancel Order Button - Show when there's an active order */}
                    {myOrders.filter(
                      (o) => o.status !== "paid" && o.status !== "cancelled"
                    ).length > 0 && (
                      <Button
                        variant="destructive"
                        className="w-full mt-2"
                        onClick={handleCancelOrder}
                        disabled={cancelOrder.isPending}
                      >
                        {cancelOrder.isPending
                          ? "Đang hủy..."
                          : "❌ Hủy đơn hàng hiện tại"}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Desktop Cart */}
        <div className="hidden lg:block lg:col-span-1 space-y-6 order-1 lg:order-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-orange-600" />
                Giỏ hàng
                {cartItems.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-orange-100 text-orange-700"
                  >
                    {cartItems.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
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

                  <Button
                    disabled={placeOrder.isPending || cartItems.length === 0}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    onClick={() => placeOrder.mutate()}
                  >
                    {placeOrder.isPending ? "Đang gửi..." : "🚀 Gửi đơn hàng"}
                  </Button>

                  {/* Cancel Order Button - Show when there's an active order */}
                  {myOrders.filter(
                    (o) => o.status !== "paid" && o.status !== "cancelled"
                  ).length > 0 && (
                    <Button
                      variant="destructive"
                      className="w-full mt-2"
                      onClick={handleCancelOrder}
                      disabled={cancelOrder.isPending}
                    >
                      {cancelOrder.isPending
                        ? "Đang hủy..."
                        : "❌ Hủy đơn hàng hiện tại"}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Order Confirmation Dialog */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center text-red-600">
                ❌ Xác nhận hủy đơn hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-gray-700">
                Bạn có chắc chắn muốn hủy đơn hàng hiện tại không?
              </p>
              <p className="text-sm text-gray-500 text-center">
                Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={cancelOrder.isPending}
                >
                  Hủy bỏ
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={confirmCancelOrder}
                  disabled={cancelOrder.isPending}
                >
                  {cancelOrder.isPending ? "Đang hủy..." : "Xác nhận hủy"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
