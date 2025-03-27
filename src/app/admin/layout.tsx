'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut({ 
      callbackUrl: '/admin/login',
      redirect: true 
    });
  };

  // Nếu đang ở trang login, chỉ hiển thị form login
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex">
      <div className="bg-[#1a3547] text-white w-64 min-h-screen">
        <div className="p-4">
          <h1 className="text-xl font-bold">Trang Quản Trị</h1>
        </div>
        <nav className="mt-4">
          <Link href="/admin" className="block px-4 py-2 hover:bg-[#234156]">
            Dashboard
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

      <div className="flex-1">
        <header className="bg-white shadow">
          <div className="flex justify-between items-center px-4 py-3">
            <h2 className="text-xl font-semibold">Admin Dashboard</h2>
            {status === 'authenticated' && session?.user && (
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