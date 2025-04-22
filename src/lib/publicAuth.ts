import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import UserModel from "@/lib/models/User"; // Đảm bảo đường dẫn đúng
import connectDB from "@/lib/db";         // Đảm bảo đường dẫn đúng
// Bỏ type User nếu không dùng: import type { User } from "@/types/user";

// *** Đặt tên cookie cho public (dùng tên mặc định hoặc khác admin - phiên bản localhost) ***
const publicCookieNameBase = 'next-auth'; // Tên cơ sở (giống mặc định)

export const publicAuthOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'user-credentials', // ID này phải khớp với lời gọi signIn trong UserLoginForm
      name: "User credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      // --- Logic authorize của bạn (giữ nguyên) ---
      async authorize(credentials) {
        try {
          console.log('[PublicAuth] Starting user authorization');
          await connectDB();

          if (!credentials) {
            console.log('[PublicAuth] No credentials provided');
            return null;
          }

          console.log('[PublicAuth] Finding user:', credentials.username);
          // Tìm user có role 'user' (hoặc có thể bỏ điều kiện role nếu form này cho mọi loại user trừ admin?)
          const user = await UserModel.findOne({
            username: credentials.username,
            // role: 'user' // Chỉ cho phép role 'user' đăng nhập ở đây
          }).select('+password'); // Lấy cả password

          if (!user || !user.password) {
            console.log('[PublicAuth] User not found or no password');
            return null;
          }

          // Phân biệt với Admin: Chỉ user có role 'user' mới được đăng nhập qua đây
          // (Nếu admin cố đăng nhập ở form public -> lỗi)
          if (user.role !== 'user') {
            console.log(`[PublicAuth] User found but has incorrect role: ${user.role}. Denying.`);
            return null; // Không cho phép role khác 'user' đăng nhập ở đây
          }

          // Kiểm tra user có bị khóa không
          if (!user.isActive) {
            console.log('[PublicAuth] User is not active');
            // throw new Error('Tài khoản của bạn đã bị khóa.');
            return null;
          }

          console.log('[PublicAuth] Checking password');
          const isValid = await bcrypt.compare(credentials.password, user.password);

          if (!isValid) {
            console.log('[PublicAuth] Invalid password');
            return null;
          }

          console.log('[PublicAuth] User authorization successful');
          // Trả về object user (không bao gồm password)
          return {
            id: user._id.toString(),
            email: user.email,
            username: user.username,
            fullName: user.fullName,
            role: user.role, // Vẫn trả về role 'user'
            isActive: user.isActive, // Trả về trạng thái active
            // Không bao gồm password
          };
        } catch (error) {
          console.error('[PublicAuth] Authorize error:', error);
          return null;
        }
      }
    })
    // Có thể thêm các providers khác (Google, etc.) ở đây
  ],
  // --- Cấu hình pages của bạn (giữ nguyên) ---
  pages: {
    signIn: '/login',             // Trang đăng nhập public
    error: '/login?error=true', // Trang lỗi, có thể thêm tham số để hiển thị thông báo
    // signOut: '/',
    // verifyRequest: '/auth/verify-request',
    // newUser: '/register'
  },

  // *** Thêm cấu hình cookies riêng cho public (dùng tên mặc định - khác admin) ***
  cookies: {
    sessionToken: {
      // Tên mặc định của NextAuth, không có suffix -admin
      name: `${publicCookieNameBase}.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // false cho HTTP localhost
      },
    },
    callbackUrl: {
      name: `${publicCookieNameBase}.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // false cho HTTP localhost
      },
    },
    csrfToken: {
      name: `${publicCookieNameBase}.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // false cho HTTP localhost
      },
    },
  },

  // --- Cấu hình session của bạn (giữ nguyên) ---
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60 // 7 days (hoặc tùy chỉnh)
  },

  // --- Callbacks của bạn (giữ nguyên và bổ sung type) ---
  callbacks: {
    // Callback này chạy sau authorize, có thể kiểm tra thêm
    async signIn({ user, account, profile, email, credentials }) {
      console.log('[PublicAuth] SignIn callback - User data:', user);
      const isActive = (user as any)?.isActive;

      if (isActive) {
        console.log('[PublicAuth] SignIn callback - User is active. Allowing sign in.');
        return true;
      } else {
        console.log('[PublicAuth] SignIn callback - User is not active. Denying sign in.');
        // return '/login?error=AccountLocked'; // Redirect đến trang lỗi cụ thể
        return false;
      }
    },
    // Thêm thông tin vào JWT
    async jwt({ token, user }) {
      // console.log('[PublicAuth] JWT callback - Initial token:', token);
      if (user) {
        console.log('[PublicAuth] JWT callback - User object present, adding to token:', user);
        token.id = user.id;
        token.username = (user as any).username;
        token.fullName = (user as any).fullName;
        token.role = (user as any).role; // Role sẽ là 'user'
        token.isActive = (user as any).isActive; // Thêm trạng thái active
      }
      // console.log('[PublicAuth] JWT callback - Final token:', token);
      return token;
    },
    // Tạo session từ token
    async session({ session, token }) {
      // console.log('[PublicAuth] Session callback - Initial session:', session);
      // console.log('[PublicAuth] Session callback - Token received:', token);
      if (token && session.user) {
        console.log('[PublicAuth] Session callback - Adding token data to session.user');
        (session.user as any).id = token.id;
        (session.user as any).username = token.username;
        (session.user as any).fullName = token.fullName;
        (session.user as any).role = token.role; // Role sẽ là 'user'
        (session.user as any).isActive = token.isActive; // Thêm trạng thái active
      }
      // console.log('[PublicAuth] Session callback - Final session:', session);
      return session;
    }
  },

  secret: process.env.NEXTAUTH_SECRET, // Quan trọng

  // Bật debug logs khi ở môi trường development
  debug: process.env.NODE_ENV === 'development',
};