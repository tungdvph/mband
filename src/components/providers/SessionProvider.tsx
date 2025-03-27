'use client';

import { SessionProvider as NextAuthProvider } from 'next-auth/react';
import { AuthProvider } from '@/contexts/AuthContext';

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </NextAuthProvider>
  );
}