import jwt from 'jsonwebtoken';
import { User } from '@/types/user';
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import UserModel from "@/lib/models/User";
import connectDB from "@/lib/db";
import { JWT } from 'next-auth/jwt';
import { Session } from 'next-auth';

// Định nghĩa types mở rộng
declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    username: string;  // Đổi từ name sang username
    fullName: string;  // Thêm fullName
    role: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      username: string;  // Đổi từ name sang username
      fullName: string;  // Thêm fullName
      role: string;
    }
  }
}

// Cập nhật interface JWT
declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    fullName: string;
    role: string;
  }
}

// Cập nhật callbacks
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },  // Đổi từ email sang username
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          await connectDB();
          // Chỉ tìm theo username, không cần kiểm tra role ở đây
          const user = await UserModel.findOne({ 
            username: credentials?.username
          }).lean();

          if (!user || !credentials?.password) {
            console.log('User not found or no password');
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);

          if (!isValid) {
            console.log('Invalid password');
            return null;
          }

          // Kiểm tra role admin sau khi xác thực password
          if (user.role !== 'admin') {
            console.log('Not an admin user');
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            username: user.username,
            fullName: user.fullName,
            role: user.role
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/admin/login',  // Cập nhật đường dẫn login admin
    error: '/admin/login?error=true',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.fullName = user.fullName;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.fullName = token.fullName;
        session.user.role = token.role;
      }
      return session;
    }
  }
};