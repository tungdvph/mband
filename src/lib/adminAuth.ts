import { AuthOptions } from 'next-auth';
import { authOptions as baseAuthOptions } from './auth';

export const adminAuthOptions: AuthOptions = {
  ...baseAuthOptions,
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.admin-session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/admin',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  }
};