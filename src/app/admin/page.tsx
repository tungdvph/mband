// app/admin/page.tsx
'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Component chính cho trang /admin, đóng vai trò điều hướng
export default function AdminRootPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Ghi log trạng thái session mỗi khi effect chạy
    console.log(`[AdminRootPage] useEffect triggered. Status: ${status}, Session User Role: ${session?.user?.role}`);

    // Không thực hiện hành động gì nếu session vẫn đang tải
    if (status === 'loading') {
      console.log('[AdminRootPage] Session status: loading. Waiting...');
      return;
    }

    // Khi session đã được giải quyết (authenticated hoặc unauthenticated)
    if (status === 'authenticated') {
      // Nếu đã xác thực và là admin
      if (session?.user?.role === 'admin') {
        console.log('[AdminRootPage] Authenticated as admin. Redirecting to /admin/dashboard...');
        router.replace('/admin/dashboard');
      } else {
        // Nếu đã xác thực nhưng không phải admin (hoặc role không đúng)
        console.log(`[AdminRootPage] Authenticated but not admin (role: ${session?.user?.role}). Redirecting to /admin/login...`);
        router.replace('/admin/login');
      }
    } else { // status === 'unauthenticated'
      // Nếu chưa xác thực
      console.log('[AdminRootPage] Unauthenticated. Redirecting to /admin/login...');
      router.replace('/admin/login');
    }
  }, [status, session, router]); // Dependencies cho useEffect

  // Giao diện hiển thị trong khi session đang tải
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 text-slate-700">
        <div className="text-xl font-semibold">Đang tải trang Admin...</div>
        <p className="mt-2 text-slate-500">Vui lòng chờ trong giây lát.</p>
        {/* Spinner視覚的なフィードバック */}
        <svg className="animate-spin h-8 w-8 text-blue-600 mt-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  // Giao diện hiển thị mặc định nếu không phải đang tải (useEffect sẽ xử lý chuyển hướng)
  // Giao diện này nên hiển thị rất nhanh trước khi chuyển hướng hoàn tất.
  // Nếu bạn thấy trang "trắng tinh", có thể CSS cho phần này không được áp dụng,
  // hoặc có lỗi render khác ở cấp cao hơn.
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-6 text-center text-slate-700">
      <h1 className="text-2xl font-semibold mb-4">Đang xử lý và chuyển hướng...</h1>
      <p className="text-slate-500 mb-4">
        Bạn sẽ được tự động chuyển đến trang phù hợp.
      </p>
      <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  );
}
