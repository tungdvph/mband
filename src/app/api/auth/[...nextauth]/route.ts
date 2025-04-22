import NextAuth from 'next-auth';
import { publicAuthOptions } from '@/lib/publicAuth';

const handler = NextAuth(publicAuthOptions);
export { handler as GET, handler as POST };