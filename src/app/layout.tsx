import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/AppProviders";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bánh Cuốn Cậu Cả",
  description: "Bánh Cuốn Cậu Cả - Nhà hàng truyền thống",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/default-food.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/default-food.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppProviders>{children}</AppProviders>
        <Toaster />
      </body>
    </html>
  );
}
