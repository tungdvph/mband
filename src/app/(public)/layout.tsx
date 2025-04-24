import PublicSessionProvider from '@/components/providers/PublicSessionProvider';
import { PublicAuthProvider } from '@/contexts/PublicAuthContext';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicSessionProvider>
      <PublicAuthProvider>
        {children}
      </PublicAuthProvider>
    </PublicSessionProvider>
  );
}