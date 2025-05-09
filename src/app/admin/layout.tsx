'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import { AuthProvider } from '@/context/AuthContext';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminLayout>
        {children}
      </AdminLayout>
    </AuthProvider>
  );
} 