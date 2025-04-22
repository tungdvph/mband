'use client';
import AdminLoginForm from '@/components/admin/auth/AdminLoginForm';
import AdminSessionProvider from '@/components/providers/AdminSessionProvider';

export default function LoginPage() {
  return (
    <AdminSessionProvider>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-center mb-6">Đăng nhập Admin</h1>
          <AdminLoginForm />
        </div>
      </div>
    </AdminSessionProvider>
  );
}