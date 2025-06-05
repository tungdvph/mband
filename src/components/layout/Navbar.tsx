// src/components/layout/Navbar.tsx
'use client';
import Link from 'next/link';
import { useState } from 'react';
import UserMenu from '../auth/UserMenu'; // Đảm bảo đường dẫn này chính xác
import { usePublicAuth } from '@/contexts/PublicAuthContext'; // Đảm bảo đường dẫn này chính xác
import { useCart } from '@/contexts/CartContext'; // THÊM: Import useCart
import { FaShoppingCart } from 'react-icons/fa';
import { useRouter, usePathname } from 'next/navigation';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { isAuthenticated } = usePublicAuth();
  const { cartItems } = useCart(); // THÊM: Lấy cartItems từ context
  const router = useRouter();
  const pathname = usePathname();

  // Tính số lượng loại sự kiện khác nhau trong giỏ hàng
  const uniqueCartItemCount = cartItems.length;

  const activeColor = "text-indigo-500";
  const activeSvgStrokeColor = "#6366F1";
  const hoverColorDesktop = "hover:text-purple-400";
  const hoverSvgStrokeColorDesktop = "group-hover:stroke-purple-400";
  const inactiveColorDesktopBase = "text-white";
  const inactiveColorMobileBase = "text-gray-300";
  const hoverColorMobile = "hover:text-purple-300 hover:bg-gray-700";
  const activeColorMobile = `${activeColor} bg-gray-700`;

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
    } else {
      router.push('/cart');
    }
  };

  const closeLoginPrompt = () => setShowLoginPrompt(false);
  const handleGoLogin = () => {
    router.push('/login');
    setShowLoginPrompt(false);
  };

  return (
    // THÊM CLASS 'sticky-navbar' VÀO THẺ NAV
    <nav className="bg-black text-white sticky-navbar">
      <div className="flex items-center justify-between h-20 w-full px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <div className="flex-shrink-0 flex items-center">
          <Link href="/" className={`text-2xl font-bold flex items-center group ${inactiveColorDesktopBase} ${hoverColorDesktop} transition-colors duration-150`}>
            <span className="mr-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${hoverSvgStrokeColorDesktop} transition-colors duration-150`} fill="none" viewBox="0 0 24 24" stroke={pathname === "/" ? activeSvgStrokeColor : "white"} >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-4 0h4" />
              </svg>
            </span>
            <span className={pathname === "/" ? activeColor : `${inactiveColorDesktopBase} group-hover:text-purple-400 transition-colors duration-150`}>Cyber Band</span>
          </Link>
        </div>

        {/* Main Menu (Desktop) */}
        <div className="hidden md:flex flex-grow justify-center items-center">
          <div className="flex items-baseline space-x-6">
            <Link href="/member" className={`text-lg transition-colors duration-150 ${pathname === "/member" || pathname.startsWith("/member/") ? `${activeColor} font-semibold` : `${inactiveColorDesktopBase} ${hoverColorDesktop}`}`}>Thành viên</Link>
            <Link href="/schedule" className={`text-lg transition-colors duration-150 ${pathname === "/schedule" || pathname.startsWith("/schedule/") ? `${activeColor} font-semibold` : `${inactiveColorDesktopBase} ${hoverColorDesktop}`}`}>Lịch trình</Link>
            <Link href="/music" className={`text-lg transition-colors duration-150 ${pathname === "/music" || pathname.startsWith("/music/") ? `${activeColor} font-semibold` : `${inactiveColorDesktopBase} ${hoverColorDesktop}`}`}>Âm nhạc</Link>
            <Link href="/news" className={`text-lg transition-colors duration-150 ${pathname === "/news" || pathname.startsWith("/news/") ? `${activeColor} font-semibold` : `${inactiveColorDesktopBase} ${hoverColorDesktop}`}`}>Tin tức</Link>
            <Link href="/booking" className={`text-lg transition-colors duration-150 ${pathname === "/booking" ? `${activeColor} font-semibold` : `${inactiveColorDesktopBase} ${hoverColorDesktop}`}`}>Đặt lịch</Link>
            <Link href="/contact" className={`text-lg transition-colors duration-150 ${pathname === "/contact" ? `${activeColor} font-semibold` : `${inactiveColorDesktopBase} ${hoverColorDesktop}`}`}>Liên hệ</Link>
          </div>
        </div>

        {/* Right Section (Desktop) */}
        <div className="hidden md:flex flex-shrink-0 items-center space-x-6">
          <a
            href="/cart"
            onClick={handleCartClick}
            className={`relative flex items-center text-lg transition-colors duration-150 ${pathname === "/cart" ? activeColor : `text-gray-300 ${hoverColorDesktop}`}`}
            title="Giỏ hàng"
          >
            <span className="mr-2">Giỏ hàng</span>
            <FaShoppingCart className="h-7 w-7" />
            {uniqueCartItemCount > 0 && (
              <span className="absolute -top-2 -right-2.5 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                {uniqueCartItemCount}
              </span>
            )}
          </a>

          {!isAuthenticated ? (
            <>
              <Link href="/login" className={`text-lg transition-colors duration-150 ${pathname === "/login" ? `${activeColor} font-semibold` : `${inactiveColorDesktopBase} ${hoverColorDesktop}`}`}>Đăng nhập</Link>
              <Link href="/register" className={`text-lg transition-colors duration-150 ${pathname === "/register" ? `${activeColor} font-semibold` : `${inactiveColorDesktopBase} ${hoverColorDesktop}`}`}>Đăng ký</Link>
            </>
          ) : (
            <UserMenu />
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <a
            href="/cart"
            onClick={(e) => { handleCartClick(e); setIsOpen(false); }}
            className="relative text-gray-400 hover:text-white p-2 mr-2"
            title="Giỏ hàng"
          >
            <FaShoppingCart className="h-7 w-7" />
            {uniqueCartItemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-red-100 bg-red-600 rounded-full">
                {uniqueCartItemCount}
              </span>
            )}
          </a>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors duration-150"
            aria-controls="mobile-menu"
            aria-expanded={isOpen}
          >
            <span className="sr-only">Mở menu chính</span>
            {!isOpen ? (
              <svg className="block h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            ) : (
              <svg className="block h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/" onClick={() => setIsOpen(false)} className={`block px-3 py-3 rounded-md text-lg font-medium transition-colors duration-150 ${pathname === "/" ? activeColorMobile : `${inactiveColorMobileBase} ${hoverColorMobile}`}`}>Trang chủ</Link>
            <Link href="/member" onClick={() => setIsOpen(false)} className={`block px-3 py-3 rounded-md text-lg font-medium transition-colors duration-150 ${pathname === "/member" || pathname.startsWith("/member/") ? activeColorMobile : `${inactiveColorMobileBase} ${hoverColorMobile}`}`}>Thành viên</Link>
            <Link href="/schedule" onClick={() => setIsOpen(false)} className={`block px-3 py-3 rounded-md text-lg font-medium transition-colors duration-150 ${pathname === "/schedule" || pathname.startsWith("/schedule/") ? activeColorMobile : `${inactiveColorMobileBase} ${hoverColorMobile}`}`}>Lịch trình</Link>
            <Link href="/music" onClick={() => setIsOpen(false)} className={`block px-3 py-3 rounded-md text-lg font-medium transition-colors duration-150 ${pathname === "/music" || pathname.startsWith("/music/") ? activeColorMobile : `${inactiveColorMobileBase} ${hoverColorMobile}`}`}>Âm nhạc</Link>
            <Link href="/news" onClick={() => setIsOpen(false)} className={`block px-3 py-3 rounded-md text-lg font-medium transition-colors duration-150 ${pathname === "/news" || pathname.startsWith("/news/") ? activeColorMobile : `${inactiveColorMobileBase} ${hoverColorMobile}`}`}>Tin tức</Link>
            <Link href="/booking" onClick={() => setIsOpen(false)} className={`block px-3 py-3 rounded-md text-lg font-medium transition-colors duration-150 ${pathname === "/booking" ? activeColorMobile : `${inactiveColorMobileBase} ${hoverColorMobile}`}`}>Đặt lịch</Link>
            <Link href="/contact" onClick={() => setIsOpen(false)} className={`block px-3 py-3 rounded-md text-lg font-medium transition-colors duration-150 ${pathname === "/contact" ? activeColorMobile : `${inactiveColorMobileBase} ${hoverColorMobile}`}`}>Liên hệ</Link>
          </div>
          <div className="border-t border-gray-700 pt-4 pb-3">
            <div className="px-2 pb-2">
              <a
                href="/cart"
                onClick={(e) => { handleCartClick(e); setIsOpen(false); }}
                className={`relative flex items-center px-3 py-3 rounded-md text-lg font-medium transition-colors duration-150 ${pathname === "/cart" ? activeColorMobile : `${inactiveColorMobileBase} ${hoverColorMobile}`}`}
              >
                <span className="mr-2">Giỏ hàng</span>
                <FaShoppingCart className="h-6 w-6" />
                {uniqueCartItemCount > 0 && (
                  <span className="absolute top-1.5 left-[calc(100%_-_60px)] ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-red-100 bg-red-600 rounded-full">
                    {uniqueCartItemCount}
                  </span>
                )}
              </a>
            </div>

            {!isAuthenticated ? (
              <div className="space-y-1 px-2">
                <Link href="/login" onClick={() => setIsOpen(false)} className={`block px-3 py-3 rounded-md text-lg font-medium transition-colors duration-150 ${pathname === "/login" ? activeColorMobile : `${inactiveColorMobileBase} ${hoverColorMobile}`}`}>Đăng nhập</Link>
                <Link href="/register" onClick={() => setIsOpen(false)} className={`block px-3 py-3 rounded-md text-lg font-medium transition-colors duration-150 ${pathname === "/register" ? activeColorMobile : `${inactiveColorMobileBase} ${hoverColorMobile}`}`}>Đăng ký</Link>
              </div>
            ) : (
              <div className="px-3 py-2" onClick={() => setIsOpen(false)}> <UserMenu /> </div>
            )}
          </div>
        </div>
      )}

      {/* Login Prompt Popup */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-[9999] flex justify-center items-center p-4">
          <div
            className="fixed inset-0 bg-[rgba(0,0,0,0.5)] transition-opacity"
            onClick={closeLoginPrompt}
          ></div>
          <div
            className="relative max-w-md w-full bg-yellow-50 border border-yellow-300 p-8 pt-10 rounded-lg shadow-xl text-center transform transition-all scale-95 opacity-0 animate-fade-in-scale z-[10000]"
            style={{ animationFillMode: 'forwards', animationDuration: '0.2s' }}
          >
            <button
              onClick={closeLoginPrompt}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 p-1 rounded-full transition-colors"
              title="Đóng"
              aria-label="Đóng thông báo"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <style jsx>{`
              @keyframes fade-in-scale {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
              }
              .animate-fade-in-scale {
                animation-name: fade-in-scale;
              }
            `}</style>
            <svg className="mx-auto mb-4 w-12 h-12 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
            </svg>
            <h2 className="text-2xl font-semibold text-yellow-800 mb-4">Yêu cầu Đăng nhập</h2>
            <p className="text-gray-700 mb-6">
              Bạn cần đăng nhập để sử dụng tính năng này.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button onClick={handleGoLogin} className="px-6 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out w-full sm:w-auto">
                Đăng nhập
              </button>
              <button onClick={closeLoginPrompt} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md shadow hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition duration-150 ease-in-out w-full sm:w-auto">
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;