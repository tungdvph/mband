'use client';
import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
// Sửa dòng import này
import { useRouter, useSearchParams } from 'next/navigation';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

export default function AdminLoginForm() {
  const router = useRouter();
  // Bây giờ useSearchParams đã được import và có thể sử dụng
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/admin';

  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    try {
      // Thêm basePath để đảm bảo sử dụng API route admin
      const result = await signIn('admin-credentials', {
        username,
        password,
        redirect: false,
        callbackUrl: callbackUrl,
        basePath: '/api/admin/auth'
      });

      console.log('[AdminLoginForm] signIn Result Object:', JSON.stringify(result, null, 2));

      if (!result) {
        console.error('[AdminLoginForm] Error: signIn returned null or undefined.');
        setError('Không nhận được phản hồi từ máy chủ đăng nhập.');
      } else if (result.error) {
        console.error('[AdminLoginForm] Error from result.error:', result.error, 'Status:', result.status, 'OK:', result.ok);
        // Nên dựa vào result.error để hiển thị lỗi cụ thể hơn nếu có thể
        if (result.error === 'CredentialsSignin') {
          setError('Tên đăng nhập hoặc mật khẩu không đúng.');
        } else {
          setError(`Lỗi đăng nhập: ${result.error}`); // Hiển thị lỗi cụ thể hơn
        }
      } else if (result.ok) {
        console.log('[AdminLoginForm] Sign In OK. Client-side redirecting to:', callbackUrl);
        router.push(callbackUrl);
        // Không cần gọi router.refresh() ngay sau push, vì push thường đã đủ để trigger re-render và cập nhật session nếu middleware xử lý đúng.
        // router.refresh();
      } else {
        console.warn('[AdminLoginForm] Warning: signIn result has no error but is not ok.', result);
        setError('Trạng thái đăng nhập không xác định.');
      }

    } catch (error: any) {
      console.error('[AdminLoginForm] CATCH block error during submission:', error);
      setError('Có lỗi hệ thống xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Phần JSX của form giữ nguyên
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      {/* Input fields */}
      <div>
        <label htmlFor="username-admin" className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
        <input
          id="username-admin"
          name="username"
          type="text"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="admin"
        />
      </div>
      <div>
        <label htmlFor="password-admin" className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
        <input
          id="password-admin"
          name="password"
          type="password"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="••••••••"
        />
      </div>
      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? 'Đang xử lý...' : 'Đăng nhập Admin'}
      </button>
    </form>
  );
}