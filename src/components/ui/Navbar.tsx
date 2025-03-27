'use client';

import { useAuth } from '@/contexts/AuthContext';
// ... other imports

export default function Navbar() {
  const { isAuthenticated, user } = useAuth();
  // ... rest of your navbar code using isAuthenticated and user
}