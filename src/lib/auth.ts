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
    name: string;
    role: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
  }
}

// Giữ nguyên các hàm hiện có
export const verifyToken = (token: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
};

interface TokenUser {
  _id: string;
  role: 'user' | 'admin';
}

export const generateToken = (user: TokenUser) => {
  return jwt.sign(
    { 
      userId: user._id,
      role: user.role 
    },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
};

export const isAuthenticated = async (token?: string) => {
  if (!token) return false;
  try {
    await verifyToken(token);
    return true;
  } catch {
    return false;
  }
};

export const isAdmin = async (token?: string) => {
  if (!token) return false;
  try {
    const decoded = await verifyToken(token);
    return decoded.role === 'admin';
  } catch {
    return false;
  }
};

// Cập nhật cấu hình NextAuth
// Add this interface
interface IUserDocument {
  _id: any;
  email: string;
  password: string;
  name: string;
  role: string;
}

// Xóa interface IUserDocument và sử dụng IUser từ model

// Update the authorize function in authOptions
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          await connectDB();
          const user = await UserModel.findOne({ email: credentials?.email }).lean();

          if (!user || !credentials?.password) {
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);

          if (!isValid) {
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
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
    signIn: '/login',
    error: '/auth/error',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};