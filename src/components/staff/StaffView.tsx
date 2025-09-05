"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function StaffView() {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Đơn chưa thanh toán",
      href: "/staff/pending",
      icon: Clock,
      description: "Quản lý đơn hàng đang chờ",
    },
    {
      name: "Đơn đã thanh toán",
      href: "/staff/paid",
      icon: CheckCircle,
      description: "Lịch sử đơn hàng hoàn thành",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Back Button - Left side */}
      <motion.div
        className="fixed left-0 top-1/2 transform -translate-y-1/2 z-50"
        initial={{ scale: 0, x: -50 }}
        animate={{ scale: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <Link href="/">
          <Button
            size="lg"
            className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-2xl border-2 border-white"
            title="Về trang khách hàng"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </Button>
        </Link>
      </motion.div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            👨‍🍳 Staff Dashboard
          </h1>
          <p className="text-gray-600">Quản lý đơn hàng và thanh toán</p>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📋 Chọn loại đơn hàng
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-lg",
                    isActive
                      ? "border-green-500 bg-green-50 shadow-md"
                      : "border-gray-200 hover:border-green-300"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "p-3 rounded-lg",
                        isActive
                          ? "bg-green-500 text-white"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl mb-2">⏳</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              Đơn chờ xử lý
            </h3>
            <p className="text-2xl font-bold text-yellow-600">0</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl mb-2">👨‍🍳</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              Đang chuẩn bị
            </h3>
            <p className="text-2xl font-bold text-blue-600">0</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl mb-2">✅</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              Đã hoàn thành
            </h3>
            <p className="text-2xl font-bold text-green-600">0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
