import PublicSessionProvider from '@/components/providers/PublicSessionProvider';
import { PublicAuthProvider } from '@/contexts/PublicAuthContext';
import { CartProvider } from "@/contexts/CartContext";
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicSessionProvider>
      <PublicAuthProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </PublicAuthProvider>
    </PublicSessionProvider>
  );
}