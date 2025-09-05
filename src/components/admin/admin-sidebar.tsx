"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Clock,
  CheckCircle,
  Tags,
  Menu,
  X,
} from "lucide-react";

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isMobileOpen?: boolean;
  onMobileToggle?: () => void;
}

export default function AdminSidebar({
  collapsed,
  onToggle,
  isMobileOpen = false,
  onMobileToggle,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      name: "Thống kê",
      href: "/admin",
      icon: LayoutDashboard,
      description: "Phân tích doanh thu",
    },
    {
      name: "Món ăn",
      href: "/admin/foods",
      icon: BookOpen,
      description: "Quản lý menu",
    },
    {
      name: "Loại món",
      href: "/admin/categories",
      icon: Tags,
      description: "Quản lý loại món",
    },
    {
      name: "Đơn chưa thanh toán",
      href: "/staff/pending",
      icon: Clock,
      description: "Đơn hàng đang chờ",
    },
    {
      name: "Đơn đã thanh toán",
      href: "/staff/paid",
      icon: CheckCircle,
      description: "Lịch sử đơn hàng",
    },
    {
      name: "Đơn đã hủy",
      href: "/staff/cancelled",
      icon: X,
      description: "Lịch sử hủy đơn",
    },
    {
      name: "Cài đặt",
      href: "/admin/settings",
      icon: HelpCircle,
      description: "Cấu hình hệ thống",
    },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onMobileToggle}
        />
      )}

      {/* Mobile Menu Button */}
      <button
        onClick={onMobileToggle}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200"
      >
        {isMobileOpen ? (
          <X className="h-6 w-6 text-gray-600" />
        ) : (
          <Menu className="h-6 w-6 text-gray-600" />
        )}
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col border-r transition-all duration-300 ease-in-out",
          "bg-white border-gray-200",
          // Desktop
          collapsed ? "w-16 sm:w-20" : "w-64",
          // Mobile
          "lg:relative lg:translate-x-0",
          isMobileOpen
            ? "fixed inset-y-0 left-0 z-50 w-64 translate-x-0"
            : "fixed inset-y-0 left-0 z-50 w-64 -translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {(!collapsed || isMobileOpen) && (
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">🍽️</span>
              </div>
              <span className="font-bold text-lg text-[#6947A8]">
                Food Order Admin
              </span>
            </div>
          )}
          <button
            onClick={onToggle}
            className={cn(
              "p-1 sm:p-1.5 rounded-lg transition-colors ml-1 sm:ml-2",
              "hover:bg-gray-700 text-gray-300",
              "hidden lg:block" // Hide on mobile
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 sm:h-[19px] sm:w-6" />
            ) : (
              <ChevronLeft className="h-4 w-4 sm:h-[19px] sm:w-6" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              // Custom active logic for Courses
              let isActive = pathname === item.href;
              if (
                item.name === "Courses" &&
                [
                  "/admin/courses",
                  "/admin/modules",
                  "/admin/lessons",
                  "/admin/quizzes",
                  "/admin/words",
                ].some((p) => pathname?.startsWith(p))
              ) {
                isActive = true;
              }
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-3 rounded-lg transition-all duration-200 group",
                      isActive
                        ? "bg-[#6947A8] text-white shadow-md"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white",
                      collapsed && !isMobileOpen && "justify-center"
                    )}
                    title={collapsed ? item.name : ""}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5",
                        collapsed && !isMobileOpen ? "mx-auto" : "mr-3",
                        isActive ? "text-white" : ""
                      )}
                    />
                    {(!collapsed || isMobileOpen) && (
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div
                          className={cn(
                            "text-xs font-medium",
                            isActive
                              ? "text-white"
                              : "text-gray-600 dark:text-gray-400"
                          )}
                        >
                          {item.description}
                        </div>
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        {(!collapsed || isMobileOpen) && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-600 dark:text-gray-300 font-medium text-center">
              Food Order Admin v2.0
            </div>
          </div>
        )}
      </div>
    </>
  );
}
