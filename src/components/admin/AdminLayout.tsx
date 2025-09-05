"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  BarChart3,
  UtensilsCrossed,
  Settings,
  Crown,
  Sparkles,
  LogOut,
  User,
  Bell,
  Search,
} from "lucide-react";

const navigation = [
  {
    name: "Thống kê",
    href: "/admin",
    icon: <BarChart3 className="h-5 w-5" />,
    description: "Phân tích doanh thu",
    color: "from-emerald-500 to-teal-600",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
  },
  {
    name: "Món ăn",
    href: "/admin/foods",
    icon: <UtensilsCrossed className="h-5 w-5" />,
    description: "Quản lý menu",
    color: "from-orange-500 to-red-600",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700",
  },
  {
    name: "Đơn hàng",
    href: "/admin/orders",
    icon: <Bell className="h-5 w-5" />,
    description: "Quản lý đơn hàng",
    color: "from-blue-500 to-indigo-600",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
  },
  {
    name: "Cài đặt",
    href: "/admin/settings",
    icon: <Settings className="h-5 w-5" />,
    description: "Cấu hình hệ thống",
    color: "from-purple-500 to-pink-600",
    bgColor: "bg-purple-50",
    textColor: "text-purple-700",
  },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: sidebarOpen ? 0 : "-100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <motion.div
            className="p-8 border-b border-gray-200/50"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg">
                  <Crown className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Admin Panel
                  </h1>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Dashboard Control
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            className="px-6 py-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 text-sm"
              />
            </div>
          </motion.div>

          {/* Navigation */}
          <nav className="flex-1 px-6 space-y-2">
            {navigation.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <Link href={item.href} passHref>
                    <motion.div
                      onClick={() => setSidebarOpen(false)}
                      className={`group relative p-4 rounded-2xl transition-all duration-300 cursor-pointer
                      ${
                        isActive
                          ? `${item.bgColor} shadow-lg border border-gray-200/50`
                          : "hover:bg-gray-50 hover:shadow-md"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2 rounded-xl ${
                            isActive
                              ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                              : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
                          } transition-all duration-300`}
                        >
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <h3
                            className={`font-semibold ${
                              isActive ? item.textColor : "text-gray-800"
                            } group-hover:text-gray-900 transition-colors`}
                          >
                            {item.name}
                          </h3>
                          <p className="text-xs text-gray-500 group-hover:text-gray-600">
                            {item.description}
                          </p>
                        </div>
                        {isActive && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 bg-blue-500 rounded-full"
                          />
                        )}
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* User Profile & Logout */}
          <motion.div
            className="p-6 border-t border-gray-200/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">Admin User</p>
                <p className="text-xs text-gray-500">admin@foodorder.com</p>
              </div>
            </div>

            <button className="w-full flex items-center gap-3 p-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200">
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Đăng xuất</span>
            </button>

            <div className="mt-4 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <Settings className="h-3 w-3" />
                <span>&copy; {new Date().getFullYear()} Bánh Cuốn Cậu Cả</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                <span>Version 2.0 - Enhanced</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="lg:ml-80 flex-1">
        {/* Top Header */}
        <motion.header
          className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-200/50 px-4 py-4 lg:px-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center gap-3 text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
            >
              <div className="p-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Menu className="h-5 w-5 text-white" />
              </div>
              <span className="font-medium">Admin Menu</span>
            </button>

            {/* Desktop breadcrumb */}
            <div className="hidden lg:flex items-center gap-2 text-sm text-gray-600">
              <span>Admin</span>
              <span>/</span>
              <span className="font-medium text-gray-800">
                {navigation.find((item) => item.href === pathname)?.name ||
                  "Dashboard"}
              </span>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200">
                <Bell className="h-5 w-5" />
              </button>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
        </motion.header>

        {/* Page content */}
        <motion.main
          className="min-h-screen p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
