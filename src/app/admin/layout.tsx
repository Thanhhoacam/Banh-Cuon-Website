import AdminLayout from "@/components/admin/admin-layout";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AdminLayout>{children}</AdminLayout>
      </ThemeProvider>
    </AuthProvider>
  );
}
