import 'next-auth';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    username: string;
    email: string;
    fullName: string;
    role: string;
    _id: string; // Thêm dòng này
  }

  interface Session extends DefaultSession {
    user: User & DefaultSession['user'];
  }
}