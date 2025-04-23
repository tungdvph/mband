'use client';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({ 
      callbackUrl: '/',
      redirect: true
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-black text-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-bold">
              Band Name
            </Link>
            
            <nav className="flex items-center space-x-4">
              <Link href="/member" className="hover:text-gray-300">Thành viên</Link>
              <Link href="/schedule" className="hover:text-gray-300">Lịch trình</Link>
              <Link href="/music" className="hover:text-gray-300">Âm nhạc</Link>
              <Link href="/news" className="hover:text-gray-300">Tin tức</Link>
              <Link href="/booking" className="hover:text-gray-300">Đặt lịch</Link>
              <Link href="/contact" className="hover:text-gray-300">Liên hệ</Link>
              
              {session?.user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-white">{session.user.username}</span>
                  <button
                    onClick={handleSignOut}
                    className="text-red-500 hover:text-red-400"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link href="/login" className="hover:text-gray-300">
                    Đăng nhập
                  </Link>
                  <Link href="/register" className="hover:text-gray-300">
                    Đăng ký
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
}