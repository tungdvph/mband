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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold">
              Band Name
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link href="/member" className="hover:text-gray-300">Thành viên</Link>
              <Link href="/schedule" className="hover:text-gray-300">Lịch trình</Link>
              <Link href="/music" className="hover:text-gray-300">Âm nhạc</Link>
              <Link href="/news" className="hover:text-gray-300">Tin tức</Link>
              <Link href="/booking" className="hover:text-gray-300">Đặt lịch</Link>
              <Link href="/contact" className="hover:text-gray-300">Liên hệ</Link>
              {!isAuthenticated ? (
                <>
                  <Link href="/login" className="hover:text-gray-300">Đăng nhập</Link>
                  <Link href="/register" className="hover:text-gray-300">Đăng ký</Link>
                </>
              ) : (
                <UserMenu />
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md hover:text-gray-300"
            >
              <span className="sr-only">Open main menu</span>
              {!isOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/member" className="block hover:text-gray-300 py-2">Thành viên</Link>
            <Link href="/schedule" className="block hover:text-gray-300 py-2">Lịch trình</Link>
            <Link href="/music" className="block hover:text-gray-300 py-2">Âm nhạc</Link>
            <Link href="/news" className="block hover:text-gray-300 py-2">Tin tức</Link>
            <Link href="/booking" className="block hover:text-gray-300 py-2">Đặt lịch</Link>
            <Link href="/contact" className="block hover:text-gray-300 py-2">Liên hệ</Link>
            {!isAuthenticated ? (
              <>
                <Link href="/login" className="block hover:text-gray-300 py-2">Đăng nhập</Link>
                <Link href="/register" className="block hover:text-gray-300 py-2">Đăng ký</Link>
              </>
            ) : (
              <div className="py-2">
                <UserMenu />
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;