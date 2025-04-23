import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import PublicSessionProvider from '@/components/providers/PublicSessionProvider';
import { PublicAuthProvider } from '@/contexts/PublicAuthContext';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Music Band Website',
  description: 'Your favorite music band website',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PublicSessionProvider>
          <PublicAuthProvider>
            {children}
          </PublicAuthProvider>
        </PublicSessionProvider>
      </body>
    </html>
  );
}
