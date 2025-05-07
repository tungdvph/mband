'use client';
import React from 'react';
import PublicSessionProvider from '@/components/providers/PublicSessionProvider';
import { PublicAuthProvider } from '@/contexts/PublicAuthContext';
import { CartProvider } from "@/contexts/CartContext";

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicSessionProvider>
        <PublicAuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </PublicAuthProvider>
      </PublicSessionProvider>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}