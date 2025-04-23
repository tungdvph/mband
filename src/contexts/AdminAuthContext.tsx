'use client';
import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

interface AdminAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Nếu đang ở trang admin/login và đã đăng nhập với quyền admin, chuyển đến trang admin
    if (status === "authenticated" && session?.user?.role === 'admin' && pathname === '/admin/login') {
      router.push('/admin');
      return;
    }
    
    // Nếu đang ở các trang admin khác và chưa đăng nhập hoặc không phải admin, chuyển đến trang đăng nhập admin
    if (status !== 'loading' && pathname?.startsWith('/admin') && pathname !== '/admin/login' && 
        (!session || session.user?.role !== 'admin')) {
      router.push('/admin/login');
    }
  }, [session, status, router, pathname]);

  const value = {
    isAuthenticated: !!session && session.user?.role === 'admin',
    isLoading: status === 'loading',
    user: session?.user
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}