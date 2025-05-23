import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

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
        {/* Đã bỏ PublicSessionProvider và PublicAuthProvider */}
        {children}
      </body>
    </html>
  );
}
