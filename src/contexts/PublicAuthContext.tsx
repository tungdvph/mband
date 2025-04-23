'use client';
import { createContext, useContext, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface PublicAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
}

const PublicAuthContext = createContext<PublicAuthContextType | undefined>(undefined);

export function PublicAuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  const value = {
    isAuthenticated: !!session,
    isLoading: status === 'loading',
    user: session?.user
  };

  return (
    <PublicAuthContext.Provider value={value}>
      {children}
    </PublicAuthContext.Provider>
  );
}

export function usePublicAuth() {
  const context = useContext(PublicAuthContext);
  if (context === undefined) {
    throw new Error('usePublicAuth must be used within a PublicAuthProvider');
  }
  return context;
}