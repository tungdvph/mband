'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="bg-[#1a3547] text-white w-64 min-h-screen">
        <div className="p-4">
          <h1 className="text-xl font-bold">Trang Quản Trị</h1>
        </div>
        <nav className="mt-4">
          <Link href="/admin" className="block px-4 py-2 hover:bg-[#234156]">
            Dashboard
          </Link>
          <Link href="/admin/members" className="block px-4 py-2 hover:bg-[#234156]">
            Quản lý Thành Viên
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
          <Link href="/admin/users" className="block px-4 py-2 hover:bg-[#234156]">
            Quản lý Người Dùng
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="flex justify-between items-center px-4 py-3">
            <h2 className="text-xl font-semibold">Admin Dashboard</h2>
            <div className="flex items-center space-x-4">
              <span>Admin</span>
              <button className="text-red-600">Đăng xuất</button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}