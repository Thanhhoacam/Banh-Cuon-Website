import AdminLayout from "@/components/admin/admin-layout";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AdminLayout>{children}</AdminLayout>
      </ThemeProvider>
    </AuthProvider>
  );
}
