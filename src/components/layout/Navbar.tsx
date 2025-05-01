'use client';
import Link from 'next/link';
import { useState } from 'react';
import UserMenu from '../auth/UserMenu';
import { usePublicAuth } from '@/contexts/PublicAuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = usePublicAuth();

  return (
    <nav className="bg-black text-white">
      {/* Container chính: Sử dụng px-8 */}
      <div className="flex items-center justify-between h-16 w-full px-35">

        {/* Logo (Thay thế bằng Icon Nhà + Band Name) */}
        <div className="flex-shrink-0 flex items-center">
          {/* <<< DÁN LINK BAND NAME VÀO ĐÂY */}
          <Link href="/" className="text-xl font-bold flex items-center"> {/* Xóa mr-6 nếu không cần */}
            <span className="mr-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="white">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-4 0h4" />
              </svg>
            </span>
            Band Name
          </Link>
          {/* <<< XÓA BỎ THẺ IMG VÀ LINK CŨ Ở ĐÂY */}
        </div>

        {/* Menu chính căn giữa */}
        {/* <<< XÓA LINK BAND NAME KHỎI ĐÂY */}
        <div className="hidden md:flex flex-grow justify-center items-center">
          {/* Chỉ còn lại các link điều hướng khác */}
          <div className="flex items-baseline space-x-4">
            <Link href="/member" className="hover:text-gray-300">Thành viên</Link>
            <Link href="/schedule" className="hover:text-gray-300">Lịch trình</Link>
            <Link href="/music" className="hover:text-gray-300">Âm nhạc</Link>
            <Link href="/news" className="hover:text-gray-300">Tin tức</Link>
            <Link href="/booking" className="hover:text-gray-300">Đặt lịch</Link>
            <Link href="/contact" className="hover:text-gray-300">Liên hệ</Link>
          </div>
        </div>

        {/* Đăng nhập/Đăng ký hoặc UserMenu */}
        <div className="hidden md:flex flex-shrink-0 items-center space-x-4">
          {!isAuthenticated ? (
            <>
              <Link href="/login" className="hover:text-gray-300">Đăng nhập</Link>
              <Link href="/register" className="hover:text-gray-300">Đăng ký</Link>
            </>
          ) : (
            <UserMenu />
          )}
        </div>

        {/* Nút mở Menu Mobile */}
        <div className="md:hidden flex items-center">
          {/* Phần Mobile Button giữ nguyên */}
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

      {/* Menu Mobile (Giữ nguyên cấu trúc hiện tại) */}
      {isOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Trang chủ</Link>
            <Link href="/member" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Thành viên</Link>
            <Link href="/schedule" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Lịch trình</Link>
            <Link href="/music" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Âm nhạc</Link>
            <Link href="/news" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Tin tức</Link>
            <Link href="/booking" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Đặt lịch</Link>
            <Link href="/contact" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Liên hệ</Link>
            <div className="border-t border-gray-700 pt-4 pb-3">
              {!isAuthenticated ? (
                <div className="space-y-1 px-2">
                  <Link href="/login" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Đăng nhập</Link>
                  <Link href="/register" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Đăng ký</Link>
                </div>
              ) : (
                // Trên mobile có thể chỉ cần hiển thị UserMenu gọn hơn nếu cần
                <div className="px-3"> <UserMenu /> </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;