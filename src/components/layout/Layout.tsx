'use client';
// Bạn có thể xóa các import này nếu Navbar đã xử lý hoàn toàn logic session/auth
// import { useSession, signOut } from 'next-auth/react';
// import Link from 'next/link';

// Import Navbar
import Navbar from './Navbar'; // <- Đường dẫn đến Navbar (kiểm tra lại)

// 1. Import component Footer
//    Đảm bảo đường dẫn này chính xác đến file Footer.js của bạn
import Footer from './Footer'; // <- Đường dẫn đến Footer (kiểm tra lại)

export default function Layout({ children }: { children: React.ReactNode }) {
  // Logic session/signOut có thể nằm trong Navbar hoặc context
  // ...

  return (
    // Cấu trúc layout chính
    <div className="min-h-screen flex flex-col">
      {/* Sử dụng Navbar */}
      <Navbar />

      {/* Phần nội dung chính của trang */}
      {/* flex-grow đảm bảo main chiếm không gian còn lại, đẩy footer xuống dưới */}
      <main className="flex-grow">
        {children}
      </main>

      {/* 2. Sử dụng component Footer ở đây */}
      <Footer />
    </div>
  );
}