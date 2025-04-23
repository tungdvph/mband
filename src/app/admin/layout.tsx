'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
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
  // Lấy trạng thái xác thực từ context tùy chỉnh (hoặc trực tiếp từ useSession nếu không dùng context riêng)
  const { isAuthenticated, isLoading, user } = useAdminAuth();
  // Có thể vẫn cần useSession để lấy thông tin hiển thị như username nếu context không cung cấp đủ
  const { data: session } = useSession();
  const pathname = usePathname(); // Lấy đường dẫn hiện tại
  const router = useRouter(); // Hook để điều hướng
  const [isOpen, setIsOpen] = useState(false); // State cho menu mobile

  // --- useEffect ĐÃ SỬA LỖI ---
  useEffect(() => {
    // Chỉ thực hiện logic chuyển hướng sau khi trạng thái loading hoàn tất
    if (!isLoading) {
      // 1. Nếu KHÔNG xác thực VÀ đang truy cập một trang admin KHÁC trang login
      //    => Chuyển hướng về trang login.
      if (!isAuthenticated && pathname !== '/admin/login') {
        console.log('[AdminLayout] Chưa xác thực, đang ở trang admin khác login -> Về Login');
        router.replace('/admin/login'); // Dùng replace để không lưu vào lịch sử trình duyệt
      }
      // 2. Nếu ĐÃ xác thực VÀ đang tình cờ ở trang login
      //    => Chuyển hướng vào trang dashboard admin chính.
      else if (isAuthenticated && pathname === '/admin/login') {
        console.log('[AdminLayout] Đã xác thực, đang ở trang login -> Vào Admin');
        router.replace('/admin'); // Dùng replace
      }
      // 3. Các trường hợp còn lại là hợp lệ (Đã xác thực và ở trang admin,
      //    hoặc chưa xác thực và ở trang login) => Không làm gì cả.
    }
  }, [isAuthenticated, isLoading, pathname, router]); // Dependencies của useEffect

  // --- Các phần xử lý hiển thị ---

  // Hiển thị trạng thái đang tải trong khi chờ xác thực
  if (isLoading) {
    // Có thể thay bằng spinner hoặc skeleton UI đẹp hơn
    return <div className="flex justify-center items-center min-h-screen">Đang tải trang quản trị...</div>;
  }

  // Nếu đang ở trang đăng nhập, chỉ hiển thị nội dung của trang đó (không hiển thị sidebar, header)
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Nếu không ở trang login MÀ vẫn chưa xác thực (sau khi isLoading=false)
  // => Không hiển thị gì cả (vì useEffect đã xử lý redirect về login)
  // Điều này tránh việc hiển thị layout trống trước khi redirect hoàn tất.
  if (!isAuthenticated) {
    return null;
  }

  // Hàm xử lý đăng xuất
  const handleSignOut = async () => {
    await signOut({
      callbackUrl: '/admin/login', // Sau khi đăng xuất, quay về trang login admin
      redirect: true // Để NextAuth tự xử lý redirect
    });
  };

  // --- Giao diện Layout chính (Sidebar, Header, Main Content) ---
  // Chỉ hiển thị khi đã xác thực và không ở trang login
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
        bg-[#1a3547] text-white w-64 min-h-screen fixed lg:relative inset-y-0 left-0 z-10
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4">
          <h1 className="text-xl font-bold">Trang Quản Trị</h1>
        </div>
        <nav className="mt-4">
          {/* Các Link điều hướng trong admin */}
          <Link href="/admin" className="block px-4 py-2 hover:bg-[#234156]" onClick={() => setIsOpen(false)}>
            Trang chủ
          </Link>
          <Link href="/admin/member" className="block px-4 py-2 hover:bg-[#234156]" onClick={() => setIsOpen(false)}>
            Quản Lý Thành Viên
          </Link>
          <Link href="/admin/booking" className="block px-4 py-2 hover:bg-[#234156]" onClick={() => setIsOpen(false)}>
            Quản lý Đặt lịch
          </Link>
          <Link href="/admin/schedule" className="block px-4 py-2 hover:bg-[#234156]" onClick={() => setIsOpen(false)}>
            Quản lý Lịch trình
          </Link>
          <Link href="/admin/music" className="block px-4 py-2 hover:bg-[#234156]" onClick={() => setIsOpen(false)}>
            Quản lý Bài Hát
          </Link>
          <Link href="/admin/news" className="block px-4 py-2 hover:bg-[#234156]" onClick={() => setIsOpen(false)}>
            Quản lý Tin Tức
          </Link>
          <Link href="/admin/contact" className="block px-4 py-2 hover:bg-[#234156]" onClick={() => setIsOpen(false)}>
            Quản lý Liên Hệ
          </Link>
          <Link href="/admin/user" className="block px-4 py-2 hover:bg-[#234156]" onClick={() => setIsOpen(false)}>
            Quản lý Người Dùng
          </Link>
        </nav>
      </div>

      {/* Overlay cho mobile khi menu mở */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-0"
          onClick={() => setIsOpen(false)} // Click vào overlay để đóng menu
        />
      )}

      {/* Phần nội dung chính */}
      <div className="flex-1 transition-all duration-300 ease-in-out lg:ml-0">
        {/* Thêm margin-left khi sidebar ẩn trên desktop nếu cần */}
        {/* lg:ml-64 nếu sidebar cố định */}
        <header className="bg-white shadow sticky top-0 z-5"> {/* Header có thể để sticky */}
          <div className="flex justify-between items-center px-4 py-3">
            {/* Tiêu đề trang có thể thay đổi động ở đây */}
            <h2 className="text-xl font-semibold ml-10 lg:ml-0">Admin Dashboard</h2>
            {/* Hiển thị thông tin người dùng và nút đăng xuất */}
            {session?.user && (
              <div className="flex items-center space-x-4">
                {/* Sử dụng session.user.username hoặc user?.username từ context nếu có */}
                <span>{session.user.username ?? user?.username ?? 'Admin'}</span>
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

        {/* Nơi hiển thị nội dung của từng trang admin con */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}