"use client";

import { useRouter } from "next/navigation";
import { Menu, Sun, Moon, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { AuthButtons } from "@/components/AuthButtons";

interface AdminHeaderProps {
  onToggleSidebar: () => void;
}

export default function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const router = useRouter();

  return (
    <header
      className={cn(
        "h-16 border-b flex items-center justify-between px-6",
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      )}
    >
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className={cn(
            "p-2 rounded-lg md:hidden",
            isDarkMode
              ? "hover:bg-gray-700 text-gray-300"
              : "hover:bg-gray-100 text-gray-600"
          )}
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">🍽️</span>
          </div>
          <div className="hidden sm:block">
            <div className="font-bold text-lg text-gray-900 dark:text-white">
              Bánh Cuốn Cậu Cả
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300 font-medium">
              Admin Panel
            </div>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        {/* Home Button */}
        <button
          onClick={() => router.push("/")}
          className={cn(
            "p-2 rounded-lg transition-colors",
            isDarkMode
              ? "hover:bg-gray-700 text-gray-300"
              : "hover:bg-gray-100 text-gray-600"
          )}
          title="Về trang chủ"
        >
          <Home className="h-5 w-5" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          className={cn(
            "p-2 rounded-lg transition-colors",
            isDarkMode
              ? "hover:bg-gray-700 text-gray-300"
              : "hover:bg-gray-100 text-gray-600"
          )}
          title={isDarkMode ? "Chuyển sang sáng" : "Chuyển sang tối"}
        >
          {isDarkMode ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        {/* Auth Buttons */}
        <AuthButtons isDarkMode={isDarkMode} />
      </div>
    </header>
  );
}
