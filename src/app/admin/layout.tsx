'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import AdminSessionProvider from '@/components/providers/AdminSessionProvider';
import { AdminAuthProvider, useAdminAuth } from '@/contexts/AdminAuthContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminSessionProvider>
      <AdminAuthProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </AdminAuthProvider>
    </AdminSessionProvider>
  );
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAdminAuth();
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Nếu không xác thực và không đang tải và không ở trang đăng nhập, chuyển hướng đến trang đăng nhập
    if (!isAuthenticated && !isLoading && pathname !== '/admin/login') {
      router.replace('/admin/login');
    } 
    // Nếu đã xác thực và đang ở trang đăng nhập, chuyển hướng đến trang admin
    else if (isAuthenticated && pathname === '/admin/login') {
      router.replace('/admin');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // Hiển thị trạng thái đang tải
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Nếu đang ở trang đăng nhập, hiển thị nội dung trang đăng nhập
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Nếu chưa xác thực, không hiển thị gì
  if (!isAuthenticated) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut({ 
      callbackUrl: '/admin/login',
      redirect: true
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Nút toggle menu cho mobile */}
      <button
        className="lg:hidden fixed top-4 left-4 z-20 p-2 rounded-md bg-[#1a3547] text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Sidebar responsive */}
      <div className={`
        bg-[#1a3547] text-white w-64 min-h-screen fixed lg:relative
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4">
          <h1 className="text-xl font-bold">Trang Quản Trị</h1>
        </div>
        <nav className="mt-4">
          <Link href="/admin" className="block px-4 py-2 hover:bg-[#234156]">
            Trang chủ
          </Link>

          <Link href="/admin/member" className="block px-4 py-2 hover:bg-[#234156]">
            Quản Lý Thành Viên
          </Link>
          <Link href="/admin/booking" className="block px-4 py-2 hover:bg-[#234156]">
            Quản lý Đặt lịch
          </Link>
          <Link href="/admin/schedule" className="block px-4 py-2 hover:bg-[#234156]">
            Quản lý Lịch trình
          </Link>
          <Link href="/admin/music" className="block px-4 py-2 hover:bg-[#234156]">
            Quản lý Bài Hát
          </Link>
          <Link href="/admin/news" className="block px-4 py-2 hover:bg-[#234156]">
            Quản lý Tin Tức
          </Link>
          <Link href="/admin/contact" className="block px-4 py-2 hover:bg-[#234156]">
            Quản lý Liên Hệ
          </Link>
          <Link href="/admin/user" className="block px-4 py-2 hover:bg-[#234156]">  {/* Changed from /admin/users */}
            Quản lý Người Dùng
          </Link>
        </nav>
      </div>

      {/* Overlay cho mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className="flex-1 lg:ml-64">
        <header className="bg-white shadow">
          <div className="flex justify-between items-center px-4 py-3">
            <h2 className="text-xl font-semibold">Admin Dashboard</h2>
            {session?.user && ( // Sửa lại điều kiện này
              <div className="flex items-center space-x-4">
                <span>{session.user.username}</span>
                <button 
                  onClick={handleSignOut}
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}