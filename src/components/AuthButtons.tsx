"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "@/lib/firebase";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
} from "firebase/auth";
import { useAuth } from "@/contexts/AuthContext";
import { UserCircle, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AuthButtonsProps {
  isDarkMode?: boolean;
}

export function AuthButtons({ isDarkMode = false }: AuthButtonsProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (loading) {
    return <div className="text-sm">Loading...</div>;
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setShowEmailForm(false);
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("Auth error:", error);
      alert("Đăng nhập thất bại. Vui lòng kiểm tra email/mật khẩu.");
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks

    setIsLoggingOut(true);
    try {
      await fbSignOut(auth);
      // Clear any local state if needed
      setShowEmailForm(false);
      setEmail("");
      setPassword("");
      setIsSignUp(false);
      // Redirect to home page
      router.push("/");
      // Force refresh to clear any cached data
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
      alert("Đăng xuất thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (user) {
    return (
      <div className="relative group">
        <button
          className={cn(
            "flex items-center space-x-2 p-2 rounded-lg transition-colors",
            isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
          )}
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              <UserCircle className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block text-left">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {user.displayName || "User"}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
              {user.email}
            </p>
          </div>
        </button>

        {/* Dropdown */}
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {user.displayName || "User"}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
              {user.email}
            </p>
          </div>
          <div className="p-1">
            <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
              <UserCircle className="mr-2 h-4 w-4" />
              Profile
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showEmailForm) {
    return (
      <div className="flex gap-2 items-center">
        <form onSubmit={handleEmailAuth} className="flex gap-2 items-center">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-2 py-1 border rounded text-sm"
            required
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-2 py-1 border rounded text-sm"
            required
          />
          <button type="submit" className="px-3 py-1 border rounded text-sm">
            {isSignUp ? "Đăng ký" : "Đăng nhập"}
          </button>
        </form>
        <button
          className="px-2 py-1 text-sm text-gray-600"
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp ? "Đã có tài khoản?" : "Chưa có tài khoản?"}
        </button>
        <button
          className="px-2 py-1 text-sm text-gray-600"
          onClick={() => setShowEmailForm(false)}
        >
          Hủy
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2 items-center">
      <button
        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        onClick={() => signInWithPopup(auth, googleProvider)}
      >
        Google
      </button>
      <button
        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setShowEmailForm(true)}
      >
        Email
      </button>
    </div>
  );
}
