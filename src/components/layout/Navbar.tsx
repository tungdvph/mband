'use client';
import Link from 'next/link';
import { useState } from 'react';
import UserMenu from '../auth/UserMenu'; // Đảm bảo đường dẫn này chính xác
import { usePublicAuth } from '@/contexts/PublicAuthContext'; // Đảm bảo đường dẫn này chính xác
import { FaShoppingCart } from 'react-icons/fa'; // *** MỚI: Import icon giỏ hàng ***

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = usePublicAuth();

  return (
    <nav className="bg-black text-white">
      {/* Container chính: Sử dụng px-8 */}
      {/* Giữ nguyên class gốc của bạn nếu px-35 là cố ý */}
      <div className="flex items-center justify-between h-16 w-full px-35"> {/* Giữ px-35 nếu đây là giá trị mong muốn */}

        {/* Logo (Giữ nguyên) */}
        <div className="flex-shrink-0 flex items-center">
          <Link href="/" className="text-xl font-bold flex items-center"> {/* Xóa mr-6 nếu không cần */}
            <span className="mr-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="white">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-4 0h4" />
              </svg>
            </span>
            Cyber Band
          </Link>
        </div>

        {/* Menu chính căn giữa (Giữ nguyên) */}
        <div className="hidden md:flex flex-grow justify-center items-center">
          <div className="flex items-baseline space-x-4">
            <Link href="/member" className="hover:text-gray-300">Thành viên</Link>
            <Link href="/schedule" className="hover:text-gray-300">Lịch trình</Link>
            <Link href="/music" className="hover:text-gray-300">Âm nhạc</Link>
            <Link href="/news" className="hover:text-gray-300">Tin tức</Link>
            <Link href="/booking" className="hover:text-gray-300">Đặt lịch</Link>
            <Link href="/contact" className="hover:text-gray-300">Liên hệ</Link>
          </div>
        </div>

        {/* Đăng nhập/Đăng ký hoặc UserMenu (Desktop) */}
        {/* *** THAY ĐỔI Ở ĐÂY *** */}
        <div className="hidden md:flex flex-shrink-0 items-center space-x-4">
          {/* Thêm Link giỏ hàng vào đây, space-x-4 sẽ tự tạo khoảng cách */}
          <Link href="/cart" className="text-gray-300 hover:text-white" title="Giỏ hàng">
            <FaShoppingCart className="h-6 w-6" /> {/* Chỉ cần icon */}
          </Link>

          {/* Phần Đăng nhập/Đăng ký hoặc UserMenu giữ nguyên */}
          {!isAuthenticated ? (
            <>
              <Link href="/login" className="hover:text-gray-300">Đăng nhập</Link>
              <Link href="/register" className="hover:text-gray-300">Đăng ký</Link>
            </>
          ) : (
            <UserMenu />
          )}
        </div>

        {/* Nút mở Menu Mobile (Giữ nguyên) */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            aria-controls="mobile-menu"
            aria-expanded={isOpen}
          >
            <span className="sr-only">Mở menu chính</span>
            {!isOpen ? (
              <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            ) : (
              <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Menu Mobile */}
      {/* *** THAY ĐỔI Ở ĐÂY *** */}
      {isOpen && (
        <div className="md:hidden" id="mobile-menu">
          {/* Các link menu chính (Giữ nguyên) */}
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Trang chủ</Link>
            <Link href="/member" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Thành viên</Link>
            <Link href="/schedule" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Lịch trình</Link>
            <Link href="/music" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Âm nhạc</Link>
            <Link href="/news" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Tin tức</Link>
            <Link href="/booking" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Đặt lịch</Link>
            <Link href="/contact" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Liên hệ</Link>
          </div>
          {/* Phần dành cho Giỏ hàng, Đăng nhập/Đăng ký/UserMenu */}
          <div className="border-t border-gray-700 pt-4 pb-3">
            {/* Thêm Link giỏ hàng vào đây, ngay trên phần auth */}
            <div className="px-2 pb-2"> {/* Tạo khoảng cách dưới cho giỏ hàng */}
              <Link href="/cart" className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">
                <FaShoppingCart className="h-5 w-5 mr-2" />
                Giỏ hàng
              </Link>
            </div>

            {/* Phần Đăng nhập/Đăng ký hoặc UserMenu giữ nguyên cấu trúc */}
            {!isAuthenticated ? (
              <div className="space-y-1 px-2">
                <Link href="/login" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Đăng nhập</Link>
                <Link href="/register" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Đăng ký</Link>
              </div>
            ) : (
              <div className="px-3"> <UserMenu /> </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;