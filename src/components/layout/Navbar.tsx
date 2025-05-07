// src/components/layout/Navbar.tsx (Hoặc đường dẫn tương ứng của bạn)
'use client';
import Link from 'next/link';
import { useState } from 'react';
import UserMenu from '../auth/UserMenu'; // Đảm bảo đường dẫn này chính xác
import { usePublicAuth } from '@/contexts/PublicAuthContext'; // Đảm bảo đường dẫn này chính xác
import { FaShoppingCart } from 'react-icons/fa';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = usePublicAuth();

  return (
    <nav className="bg-black text-white">
      {/* Container chính: Tăng chiều cao từ h-16 lên h-20 (80px) */}
      <div className="flex items-center justify-between h-20 w-full px-35"> {/* Giữ px-35, tăng chiều cao */}

        {/* Logo: Tăng kích thước font và icon */}
        <div className="flex-shrink-0 flex items-center">
          <Link href="/" className="text-2xl font-bold flex items-center"> {/* Tăng từ text-xl lên text-2xl */}
            <span className="mr-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="white"> {/* Tăng từ h-6 w-6 lên h-8 w-8 */}
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-4 0h4" />
              </svg>
            </span>
            Cyber Band
          </Link>
        </div>

        {/* Menu chính căn giữa: Tăng kích thước font và khoảng cách */}
        <div className="hidden md:flex flex-grow justify-center items-center">
          <div className="flex items-baseline space-x-6"> {/* Tăng từ space-x-4 lên space-x-6 */}
            <Link href="/member" className="hover:text-gray-300 text-lg">Thành viên</Link> {/* Thêm text-lg */}
            <Link href="/schedule" className="hover:text-gray-300 text-lg">Lịch trình</Link> {/* Thêm text-lg */}
            <Link href="/music" className="hover:text-gray-300 text-lg">Âm nhạc</Link> {/* Thêm text-lg */}
            <Link href="/news" className="hover:text-gray-300 text-lg">Tin tức</Link> {/* Thêm text-lg */}
            <Link href="/booking" className="hover:text-gray-300 text-lg">Đặt lịch</Link> {/* Thêm text-lg */}
            <Link href="/contact" className="hover:text-gray-300 text-lg">Liên hệ</Link> {/* Thêm text-lg */}
          </div>
        </div>

        {/* Giỏ hàng, Đăng nhập/Đăng ký hoặc UserMenu (Desktop): Tăng kích thước font và icon */}
        <div className="hidden md:flex flex-shrink-0 items-center space-x-6"> {/* Tăng từ space-x-4 lên space-x-6 */}
          <Link href="/cart" className="text-gray-300 hover:text-white flex items-center text-lg" title="Giỏ hàng"> {/* Thêm text-lg */}
            <span className="mr-2">Giỏ hàng</span> {/* Tăng từ mr-1 lên mr-2 */}
            <FaShoppingCart className="h-7 w-7" /> {/* Tăng từ h-6 w-6 lên h-7 w-7 */}
          </Link>

          {!isAuthenticated ? (
            <>
              <Link href="/login" className="hover:text-gray-300 text-lg">Đăng nhập</Link> {/* Thêm text-lg */}
              <Link href="/register" className="hover:text-gray-300 text-lg">Đăng ký</Link> {/* Thêm text-lg */}
            </>
          ) : (
            // UserMenu có thể cần điều chỉnh kích thước bên trong component của nó nếu cần
            <UserMenu />
          )}
        </div>

        {/* Nút mở Menu Mobile: Tăng kích thước icon */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            aria-controls="mobile-menu"
            aria-expanded={isOpen}
          >
            <span className="sr-only">Mở menu chính</span>
            {!isOpen ? (
              <svg className="block h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"> {/* Tăng từ h-6 w-6 lên h-7 w-7 */}
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            ) : (
              <svg className="block h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"> {/* Tăng từ h-6 w-6 lên h-7 w-7 */}
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Menu Mobile: Tăng kích thước font, icon và padding */}
      {isOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {/* Tăng text-base lên text-lg, py-2 lên py-3 */}
            <Link href="/" className="block px-3 py-3 rounded-md text-lg font-medium text-gray-300 hover:text-white hover:bg-gray-700">Trang chủ</Link>
            <Link href="/member" className="block px-3 py-3 rounded-md text-lg font-medium text-gray-300 hover:text-white hover:bg-gray-700">Thành viên</Link>
            <Link href="/schedule" className="block px-3 py-3 rounded-md text-lg font-medium text-gray-300 hover:text-white hover:bg-gray-700">Lịch trình</Link>
            <Link href="/music" className="block px-3 py-3 rounded-md text-lg font-medium text-gray-300 hover:text-white hover:bg-gray-700">Âm nhạc</Link>
            <Link href="/news" className="block px-3 py-3 rounded-md text-lg font-medium text-gray-300 hover:text-white hover:bg-gray-700">Tin tức</Link>
            <Link href="/booking" className="block px-3 py-3 rounded-md text-lg font-medium text-gray-300 hover:text-white hover:bg-gray-700">Đặt lịch</Link>
            <Link href="/contact" className="block px-3 py-3 rounded-md text-lg font-medium text-gray-300 hover:text-white hover:bg-gray-700">Liên hệ</Link>
          </div>
          <div className="border-t border-gray-700 pt-4 pb-3">
            <div className="px-2 pb-2">
              {/* Tăng text-base lên text-lg, py-2 lên py-3, icon h-5 w-5 lên h-6 w-6 */}
              <Link href="/cart" className="flex items-center px-3 py-3 rounded-md text-lg font-medium text-gray-300 hover:text-white hover:bg-gray-700">
                <span className="mr-2">Giỏ hàng</span>
                <FaShoppingCart className="h-6 w-6" />
              </Link>
            </div>

            {!isAuthenticated ? (
              <div className="space-y-1 px-2">
                {/* Tăng text-base lên text-lg, py-2 lên py-3 */}
                <Link href="/login" className="block px-3 py-3 rounded-md text-lg font-medium text-gray-300 hover:text-white hover:bg-gray-700">Đăng nhập</Link>
                <Link href="/register" className="block px-3 py-3 rounded-md text-lg font-medium text-gray-300 hover:text-white hover:bg-gray-700">Đăng ký</Link>
              </div>
            ) : (
              // UserMenu có thể cần điều chỉnh kích thước bên trong component của nó
              <div className="px-3 py-2"> <UserMenu /> </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
