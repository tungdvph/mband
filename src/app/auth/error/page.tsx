'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthError({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Lỗi Xác Thực</h1>
        <p className="text-gray-600 mb-4">
          {searchParams.error === 'Configuration'
            ? 'Có lỗi trong cấu hình xác thực. Vui lòng thử lại sau.'
            : 'Đã xảy ra lỗi trong quá trình xác thực.'}
        </p>
        <p className="text-sm text-gray-500">
          Bạn sẽ được chuyển hướng về trang đăng nhập trong vài giây...
        </p>
      </div>
    </div>
  );
}