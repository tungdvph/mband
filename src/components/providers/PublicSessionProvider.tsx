'use client';

import { SessionProvider } from 'next-auth/react';

export default function PublicSessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider basePath="/api/auth">
      {children}
    </SessionProvider>
  );
}
