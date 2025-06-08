// src/app/admin/layout.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import AdminSessionProvider from '@/components/providers/AdminSessionProvider'; // Đảm bảo import đúng
import { AdminAuthProvider, useAdminAuth } from '@/contexts/AdminAuthContext'; // Đảm bảo import đúng

// --- THÊM: Import Icons ---
import {
  FaTachometerAlt, // Dashboard
  FaUsersCog,        // Quản lý Users (Admin)
  FaCalendarAlt,   // Schedule
  FaMusic,         // Music
  FaBookmark,      // Booking (Đặt lịch sự kiện)
  FaUsers,         // Member (Thành viên ban nhạc)
  FaTicketAlt,     // Ticket Booking (Đặt vé)
  FaAddressBook,   // Contact
  FaNewspaper,     // News
  FaComments,      // Comments
  FaSignOutAlt,    // Logout
  FaBars,          // Menu icon
  FaTimes          // Close icon
} from 'react-icons/fa';
// -------------------------

// Component cha cung cấp các Provider
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

// --- THÊM: Định nghĩa các mục điều hướng với icon ---
const navigationItems = [
  { href: '/admin', label: 'Bảng điều khiển', icon: FaTachometerAlt },
  { href: '/admin/user', label: 'Quản lý Tài khoản', icon: FaUsersCog },
  { href: '/admin/member', label: 'Quản lý Thành viên', icon: FaUsers },
  { href: '/admin/schedule', label: 'Quản lý Lịch trình', icon: FaCalendarAlt },
  { href: '/admin/music', label: 'Quản lý Âm nhạc', icon: FaMusic },
  { href: '/admin/booking', label: 'Quản lý Đặt lịch', icon: FaBookmark },
  { href: '/admin/ticket-booking', label: 'Quản lý Đặt vé', icon: FaTicketAlt },
  { href: '/admin/news', label: 'Quản lý Tin tức', icon: FaNewspaper },
  // { href: '/admin/contact', label: 'Quản lý Liên hệ', icon: FaAddressBook },
  { href: '/admin/comment', label: 'Quản lý Bình luận', icon: FaComments },
];
// ----------------------------------------------------

// Component con để chứa logic và giao diện chính của layout
function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  // Lấy trạng thái xác thực từ context tùy chỉnh
  const { isAuthenticated, isLoading, user } = useAdminAuth();
  // Lấy session để hiển thị thông tin user (có thể lấy từ user của useAdminAuth nếu đủ)
  const { data: session } = useSession(); // Vẫn dùng useSession để lấy thông tin hiển thị nếu cần
  const pathname = usePathname(); // Lấy đường dẫn hiện tại
  const router = useRouter(); // Hook để điều hướng
  const [isOpen, setIsOpen] = useState(false); // State cho menu mobile

  // useEffect xử lý redirect khi login/chưa login
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

  // Hiển thị trạng thái đang tải
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen bg-gray-100 text-gray-700">Đang tải trang quản trị...</div>;
  }

  // Nếu đang ở trang đăng nhập, chỉ hiển thị nội dung của trang đó
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Nếu không ở trang login mà vẫn chưa xác thực (sau khi isLoading=false), không hiển thị gì
  if (!isAuthenticated) {
    // Reload lại trang nếu chưa xác thực
    if (typeof window !== "undefined") {
      window.location.reload();
    }
    return null;
  }

  // Hàm xử lý đăng xuất sử dụng signOut của NextAuth
  const handleSignOut = async () => {
    console.log("[NextAuth Signout] Bắt đầu quá trình đăng xuất admin...");
    try {
      await signOut({
        callbackUrl: '/admin/login', // Đảm bảo chuyển về trang login sau khi logout
        redirect: true
      });
      console.log("[NextAuth Signout] Yêu cầu đăng xuất admin đã được gửi và xử lý.");
    } catch (error) {
      console.error("[NextAuth Signout] Lỗi xảy ra trong quá trình đăng xuất admin:", error);
      alert("Lỗi: Đã có lỗi xảy ra khi cố gắng đăng xuất.");
    }
  };


  // --- Giao diện Layout chính (Sidebar, Header, Main Content) ---
  return (
    <div className="min-h-screen flex bg-gray-100"> {/* Thêm màu nền cho toàn bộ trang */}
      {/* Nút toggle menu cho mobile */}
      <button
        className="lg:hidden fixed top-4 left-4 z-30 p-2 rounded-md bg-gray-800 text-white shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white" // Cập nhật style nút
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu" // Thêm aria-label
      >
        {/* Sử dụng icon từ react-icons */}
        {isOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
      </button>

      {/* --- SIDEBAR ĐÃ SỬA ĐỔI --- */}
      <div className={`
        flex flex-col h-screen w-64 bg-gradient-to-b from-gray-800 to-gray-900 text-gray-100 shadow-lg
        fixed lg:relative inset-y-0 left-0 z-20  /* Tăng z-index */
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo hoặc Tên trang Admin */}
        <div className="p-5 text-center border-b border-gray-700 flex-shrink-0">
          <Link href="/admin" className="text-2xl font-semibold text-white hover:text-indigo-300 transition-colors">
            CyberPanel
          </Link>
        </div>

        {/* Danh sách điều hướng */}
        <nav className="flex-grow p-3 space-y-1.5 overflow-y-auto"> {/* Giảm space-y và padding */}
          {navigationItems.map((item) => {
            // Kiểm tra active state: chính xác hoặc bắt đầu bằng href (cho các route con)
            // loại trừ trường hợp href='/admin' mà pathname='/admin/somepage'
            const isActive = item.href === '/admin'
              ? pathname === item.href
              : pathname.startsWith(item.href);

            const IconComponent = item.icon; // Lấy component icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)} // Đóng menu khi click trên mobile
                className={`
                  flex items-center px-3 py-2 rounded-md text-sm font-medium group
                  transition-all duration-150 ease-in-out transform hover:translate-x-1
                  ${isActive
                    ? 'bg-indigo-700 text-white shadow-md' // Kiểu khi active
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white' // Kiểu mặc định và hover
                  }
                `}
              >
                <IconComponent
                  aria-hidden="true" // Icon trang trí
                  className={`
                    mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-150
                    ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}
                    `}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Phần dưới cùng (ví dụ: nút logout) */}
        <div className="p-3 border-t border-gray-700 mt-auto flex-shrink-0">
          {/* Có thể thêm thông tin user ở đây nếu muốn */}
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-3 py-2 rounded-md text-sm font-medium text-red-400 hover:bg-red-900/50 hover:text-red-300 group transition-colors duration-150 ease-in-out"
          >
            <FaSignOutAlt aria-hidden="true" className="mr-3 h-5 w-5 text-red-500 group-hover:text-red-400 transition-colors" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
      {/* --- KẾT THÚC SIDEBAR ĐÃ SỬA ĐỔI --- */}


      {/* Overlay cho mobile khi menu mở */}
      {isOpen && (
        <div
          aria-hidden="true" // Overlay chỉ có tác dụng UI
          className="fixed inset-0 bg-black bg-opacity-60 lg:hidden z-10" // Giảm z-index so với sidebar
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Phần nội dung chính */}
      {/* */}
      <div className="flex-1 w-full flex flex-col transition-all duration-300 ease-in-out">
        <header className="bg-white shadow sticky top-0 z-10"> {/* Giảm z-index header */}
          <div className="flex justify-between items-center pl-1 pr-4 sm:pr-6 lg:pr-8 py-3"> {/* Giảm pl, giữ pr */}
            {/* Placeholder để đẩy nội dung header sang phải khi sidebar ẩn trên mobile */}
            <div className="lg:hidden w-10"></div>
            {/* Có thể thêm Breadcrumbs hoặc tiêu đề trang động ở đây */}
            <div className="text-xl font-semibold text-gray-700">
              {/* Tìm label tương ứng với pathname hiện tại */}
              {navigationItems.find(item => item.href === pathname)?.label || 'Admin'}
            </div>
            {/* Hiển thị thông tin người dùng và nút đăng xuất */}
            {(session?.user || user) && (
              <div className="flex items-center space-x-4">
                {/* Có thể thêm avatar user */}
                <span className="text-sm font-medium text-gray-600 hidden sm:inline">
                  Chào, {session?.user?.username ?? user?.username ?? 'Admin'}
                </span>
                {/* Thêm dấu | ngăn cách (tùy chọn) */}
                <span className="text-gray-300 hidden sm:inline">|</span>
                {/* Nút đăng xuất trong header */}
                <button
                  onClick={handleSignOut} // Gọi hàm đăng xuất
                  className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors duration-150 ease-in-out focus:outline-none focus:underline" // Thêm focus style
                  title="Đăng xuất khỏi tài khoản admin" // Thêm title cho tooltip
                >
                  Đăng xuất
                </button>
                {/* --- KẾT THÚC SỬA ĐỔI --- */}
              </div>
            )}
          </div>
        </header>
        {/* Nơi hiển thị nội dung của từng trang admin con */}
        <main className="flex-grow px-1 sm:px-4 lg:px-6 pt-4 pb-6">
          {children}
        </main>

        {/* Footer (Tùy chọn) */}
        <footer className="p-4 bg-white border-t text-center text-sm text-gray-500">
          © {new Date().getFullYear()} CyberBand Admin Panel.
        </footer>
      </div>
    </div>
  );
}