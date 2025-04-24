'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
// Import signOut từ next-auth/react
import { useSession, signOut } from 'next-auth/react'; // Bỏ getCsrfToken nếu không dùng ở đâu khác
import { usePathname, useRouter } from 'next/navigation';
import AdminSessionProvider from '@/components/providers/AdminSessionProvider'; // Đảm bảo import đúng
import { AdminAuthProvider, useAdminAuth } from '@/contexts/AdminAuthContext'; // Đảm bảo import đúng

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Cung cấp Session Provider và Auth Provider cho toàn bộ layout admin
    <AdminSessionProvider>
      <AdminAuthProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </AdminAuthProvider>
    </AdminSessionProvider>
  );
}

// Component con để chứa logic và giao diện chính của layout
function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  // Lấy trạng thái xác thực từ context tùy chỉnh
  const { isAuthenticated, isLoading, user } = useAdminAuth();
  // Lấy session để hiển thị thông tin user (có thể lấy từ user của useAdminAuth nếu đủ)
  const { data: session } = useSession(); // Vẫn dùng useSession để lấy thông tin hiển thị nếu cần
  const pathname = usePathname(); // Lấy đường dẫn hiện tại
  const router = useRouter(); // Hook để điều hướng
  const [isOpen, setIsOpen] = useState(false); // State cho menu mobile

  // useEffect xử lý redirect khi login/chưa login (giữ nguyên)
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && pathname !== '/admin/login') {
        console.log('[AdminLayout] Chưa xác thực, đang ở trang admin khác login -> Về Login');
        router.replace('/admin/login');
      } else if (isAuthenticated && pathname === '/admin/login') {
        console.log('[AdminLayout] Đã xác thực, đang ở trang login -> Vào Admin');
        router.replace('/admin');
      }
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // Hiển thị trạng thái đang tải (giữ nguyên)
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Đang tải trang quản trị...</div>;
  }

  // Nếu đang ở trang đăng nhập, chỉ hiển thị nội dung của trang đó (giữ nguyên)
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Nếu không ở trang login mà vẫn chưa xác thực (sau khi isLoading=false), không hiển thị gì (giữ nguyên)
  // Điều này quan trọng để tránh flash nội dung trước khi redirect
  if (!isAuthenticated) {
    return null; // Hoặc có thể trả về một trang loading khác nếu muốn
  }

  // --- Hàm xử lý đăng xuất sử dụng signOut của NextAuth ---
  const handleSignOut = async () => {
    console.log("[NextAuth Signout] Bắt đầu quá trình đăng xuất admin...");
    try {
      // Gọi hàm signOut của NextAuth
      // SessionProvider được cấu hình trong AdminSessionProvider sẽ đảm bảo
      // lời gọi này nhắm đúng vào /api/admin/auth/signout
      await signOut({
        callbackUrl: '/admin/login', // Vẫn giữ callbackUrl
        redirect: true              // Vẫn giữ redirect
        // Không cần 'basePath' ở đây nữa
      });
      console.log("[NextAuth Signout] Yêu cầu đăng xuất admin đã được gửi và xử lý.");
    } catch (error) {
      console.error("[NextAuth Signout] Lỗi xảy ra trong quá trình đăng xuất admin:", error);
      alert("Lỗi: Đã có lỗi xảy ra khi cố gắng đăng xuất.");
    }
  };


  // --- Giao diện Layout chính (Sidebar, Header, Main Content) ---
  return (
    <div className="min-h-screen flex">
      {/* Nút toggle menu cho mobile */}
      <button
        className="lg:hidden fixed top-4 left-4 z-20 p-2 rounded-md bg-[#1a3547] text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* SVG Icon */}
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" >
          {isOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
        </svg>
      </button>

      {/* Sidebar responsive */}
      <div className={`
        bg-[#1a3547] text-white w-64 min-h-screen fixed lg:relative inset-y-0 left-0 z-10
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4">
          <h1 className="text-xl font-bold">Trang Quản Trị</h1>
        </div>
        <nav className="mt-4">
          {/* Các Link điều hướng (đóng menu khi click trên mobile) */}
          <Link href="/admin" className="block px-4 py-2 hover:bg-[#234156]" onClick={() => setIsOpen(false)}>Trang chủ</Link>
          <Link href="/admin/member" className="block px-4 py-2 hover:bg-[#234156]" onClick={() => setIsOpen(false)}>Quản Lý Thành Viên</Link>
          <Link href="/admin/booking" className="block px-4 py-2 hover:bg-[#234156]" onClick={() => setIsOpen(false)}>Quản lý Đặt lịch</Link>
          <Link href="/admin/schedule" className="block px-4 py-2 hover:bg-[#234156]" onClick={() => setIsOpen(false)}>Quản lý Lịch trình</Link>
          <Link href="/admin/music" className="block px-4 py-2 hover:bg-[#234156]" onClick={() => setIsOpen(false)}>Quản lý Bài Hát</Link>
          <Link href="/admin/news" className="block px-4 py-2 hover:bg-[#234156]" onClick={() => setIsOpen(false)}>Quản lý Tin Tức</Link>
          <Link href="/admin/contact" className="block px-4 py-2 hover:bg-[#234156]" onClick={() => setIsOpen(false)}>Quản lý Liên Hệ</Link>
          <Link href="/admin/user" className="block px-4 py-2 hover:bg-[#234156]" onClick={() => setIsOpen(false)}>Quản lý Người Dùng</Link>
        </nav>
      </div>

      {/* Overlay cho mobile khi menu mở */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-0"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Phần nội dung chính */}
      <div className="flex-1 transition-all duration-300 ease-in-out lg:ml-0">
        <header className="bg-white shadow sticky top-0 z-5">
          <div className="flex justify-between items-center px-4 py-3">
            <h2 className="text-xl font-semibold ml-10 lg:ml-0">Admin Dashboard</h2>
            {/* Hiển thị thông tin người dùng và nút đăng xuất */}
            {/* Kiểm tra cả session và user từ context nếu cần */}
            {(session?.user || user) && (
              <div className="flex items-center space-x-4">
                {/* Ưu tiên hiển thị từ session hoặc từ context nếu session không có */}
                <span>{session?.user?.username ?? user?.username ?? 'Admin'}</span>
                {/* Nút đăng xuất gọi hàm handleSignOut mới */}
                <button
                  onClick={handleSignOut} // <<< ĐÃ CẬP NHẬT onClick để gọi hàm mới
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Nơi hiển thị nội dung của từng trang admin con */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}