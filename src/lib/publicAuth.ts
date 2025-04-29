import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import UserModel from "@/lib/models/User"; // Đảm bảo đường dẫn đúng
import connectDB from "@/lib/db";          // Đảm bảo đường dẫn đúng

// Đặt tên cookie cho public
const publicCookieNameBase = 'next-auth-public';
// Xác định môi trường production
const isProduction = process.env.NODE_ENV === 'production';

export const publicAuthOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'user-credentials',
      name: "User credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          console.log('[PublicAuth] Authorizing...');
          await connectDB();

          if (!credentials) {
            console.log('[PublicAuth] No credentials.');
            return null;
          }

          console.log('[PublicAuth] Finding user:', credentials.username);
          const user = await UserModel.findOne({
            username: credentials.username,
          }).select('+password +isActive +role +fullName +email'); // Lấy đủ các trường cần thiết

          if (!user || !user.password) {
            console.log('[PublicAuth] User not found or no password.');
            return null;
          }

          // Chỉ cho phép role 'user' đăng nhập ở đây
          if (user.role !== 'user') {
            console.log(`[PublicAuth] Incorrect role: ${user.role}. Denying.`);
            return null;
          }

          if (!user.isActive) {
            console.log('[PublicAuth] User is inactive.');
            // throw new Error('Tài khoản đã bị khóa'); // Ném lỗi sẽ hiển thị trên trang error
            return null;
          }

          console.log('[PublicAuth] Checking password...');
          const isValid = await bcrypt.compare(credentials.password, user.password);

          if (!isValid) {
            console.log('[PublicAuth] Invalid password.');
            return null;
          }

          console.log('[PublicAuth] Authorization successful.');
          // Trả về object khớp với interface User mở rộng (trừ password)
          return {
            id: user._id.toString(),
            _id: user._id.toString(), // Có thể giữ lại _id
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            isActive: user.isActive,
          };
        } catch (error) {
          console.error('[PublicAuth] Authorize error:', error);
          return null; // Lỗi thì trả về null
        }
      }
    })
    // Thêm providers khác nếu có
  ],
  pages: {
    signIn: '/login',
    error: '/login', // Gửi lỗi về trang login, có thể thêm query param ?error=...
  },

  // Cấu hình cookies
  cookies: {
    sessionToken: {
      name: `${publicCookieNameBase}.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProduction, // true khi production
      },
    },
    callbackUrl: {
      name: `${publicCookieNameBase}.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProduction,
      },
    },
    csrfToken: {
      name: `${isProduction ? '__Host-' : ''}${publicCookieNameBase}.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProduction,
      },
    },
  },

  // Chiến lược session
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60 // 7 ngày
  },

  // Callbacks
  callbacks: {
    async signIn({ user }) {
      // Kiểm tra user có tồn tại và isActive không
      const canSignIn = !!user && (user as any).isActive; // user từ authorize đã có isActive
      console.log(`[PublicAuth] SignIn callback - User active check: ${canSignIn}`);
      if (!canSignIn) {
        // Ngăn chặn đăng nhập nếu không active
        // throw new Error('Tài khoản bị khóa!'); // Ném lỗi sẽ tốt hơn return false
        return false; // Hoặc return false
      }
      return true; // Cho phép đăng nhập
    },

    // Chỉ lưu ID vào token JWT
    async jwt({ token, user }) {
      if (user) {
        // user object từ authorize callback
        token.sub = user.id; // Gán ID vào 'sub'
      }
      return token;
    },

    // Luôn fetch dữ liệu mới từ DB cho session
    async session({ session, token }) {
      console.log('[PublicAuth] Session callback - Started. Token sub:', token?.sub);
      if (token?.sub) { // Chỉ tiếp tục nếu có ID user trong token
        try {
          await connectDB();
          console.log(`[PublicAuth] Session callback - Fetching user data for ID: ${token.sub}`);
          const latestUser = await UserModel.findById(token.sub)
            .select('-password') // Loại bỏ password
            .lean();

          if (latestUser) {
            console.log('[PublicAuth] Session callback - Found user in DB. Updating session...');
            // Cập nhật session.user với dữ liệu mới nhất và đúng kiểu
            // Đảm bảo các trường khớp với interface User và Session trong .d.ts
            session.user = {
              ...session.user, // Giữ lại các trường mặc định như name, image nếu có
              id: latestUser._id.toString(),
              _id: latestUser._id.toString(), // Thêm _id nếu cần
              username: latestUser.username,
              email: latestUser.email,
              fullName: latestUser.fullName,
              role: latestUser.role,
              isActive: latestUser.isActive,
            };
          } else {
            // Không tìm thấy user trong DB -> coi như session không hợp lệ
            console.log(`[PublicAuth] Session callback - User ID ${token.sub} not found. Setting session.user to null.`);
            session.user = null; // <<< Gán null khi không tìm thấy user
          }
        } catch (error) {
          console.error('[PublicAuth] Session callback - DB Error:', error);
          // Lỗi DB -> coi như session không hợp lệ
          session.user = null; // <<< Gán null khi có lỗi DB
        }
      } else {
        console.log('[PublicAuth] Session callback - No user ID in token. Setting session.user to null.');
        // Không có ID trong token -> session không hợp lệ
        session.user = null; // <<< Gán null khi không có token.sub
      }
      console.log('[PublicAuth] Session callback - Finished. Returning session:', session);
      return session; // Trả về session (có thể user là null)
    }
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: !isProduction, // Bật debug khi không phải production
};