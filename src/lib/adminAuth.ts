import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import UserModel from "@/lib/models/User"; // Đảm bảo đường dẫn này đúng
import connectDB from "@/lib/db";         // Đảm bảo đường dẫn này đúng
// Bỏ type User nếu không dùng trực tiếp ở đây: import type { User } from "@/types/user";

// *** Đặt tên cookie riêng cho admin (phiên bản localhost) ***
const adminCookieNameBase = 'next-auth'; // Tên cơ sở

export const adminAuthOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'admin-credentials', // ID này phải khớp với lời gọi signIn trong AdminLoginForm
      name: "Admin credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      // --- Logic authorize của bạn (giữ nguyên) ---
      async authorize(credentials) {
        try {
          console.log('[AdminAuth] Starting admin authorization');
          await connectDB();

          if (!credentials) {
            console.log('[AdminAuth] No credentials provided');
            // Nên trả về null thay vì throw error để NextAuth xử lý lỗi thân thiện hơn
            // throw new Error('Credentials not provided');
             return null;
          }

          console.log('[AdminAuth] Finding admin user:', credentials.username);
          // Tìm user là admin và lấy cả password
          const user = await UserModel.findOne({
            username: credentials.username,
            role: 'admin' // Đảm bảo chỉ admin mới đăng nhập được qua form này
          }).select('+password'); // Lấy cả trường password (nếu nó bị ẩn mặc định)

          if (!user || !user.password) {
            console.log('[AdminAuth] Admin user not found or no password');
            // Nên trả về null
            // throw new Error('User not found');
            return null;
          }

          console.log('[AdminAuth] Checking password');
          const isValid = await bcrypt.compare(credentials.password, user.password);

          if (!isValid) {
            console.log('[AdminAuth] Invalid password');
             // Nên trả về null
            // throw new Error('Invalid password');
            return null;
          }

          // Kiểm tra thêm nếu user admin có bị vô hiệu hóa không
          if (!user.isActive) {
              console.log('[AdminAuth] Admin user is not active');
              // Có thể trả về null hoặc throw lỗi cụ thể để báo cho người dùng
              // throw new Error('Tài khoản admin đã bị khóa.'); // NextAuth sẽ bắt lỗi này
              return null; // Hoặc chỉ đơn giản là không cho đăng nhập
          }


          console.log('[AdminAuth] Admin authorization successful');
          // Trả về object chứa thông tin cần thiết cho session/token
          // Đảm bảo các trường này tồn tại trong UserModel của bạn
          return {
            id: user._id.toString(),
            email: user.email, // Đảm bảo có email
            username: user.username, // Đảm bảo có username
            fullName: user.fullName, // Đảm bảo có fullName
            role: user.role,         // Quan trọng: Phải có role
            isActive: user.isActive   // Có thể hữu ích
            // Không trả về password ở đây
          };
        } catch (error) {
          console.error('[AdminAuth] Authorize error:', error);
          // Trả về null để NextAuth xử lý lỗi chung
          // Hoặc throw error nếu muốn hiển thị lỗi cụ thể (cần cấu hình trang error)
          // throw new Error("Lỗi xác thực quản trị viên");
          return null;
        }
      }
    })
  ],
  // --- Cấu hình pages của bạn (giữ nguyên) ---
  pages: {
    signIn: '/admin/login', // Trang đăng nhập admin
    error: '/admin/login',  // Trang hiển thị lỗi (có thể trỏ về trang login)
    // newUser: '/admin/register' // Trang đăng ký admin nếu có
  },

  // *** Thêm cấu hình cookies riêng cho admin (phiên bản localhost) ***
  cookies: {
    sessionToken: {
      // Tên không có prefix __Secure- hoặc __Host- cho localhost (HTTP)
      name: `${adminCookieNameBase}.session-token-admin`,
      options: {
        httpOnly: true,
        sameSite: 'lax', // 'lax' thường đủ cho localhost
        path: '/',
        secure: false, // Quan trọng: false cho HTTP localhost
      },
    },
    callbackUrl: {
      name: `${adminCookieNameBase}.callback-url-admin`,
      options: {
        httpOnly: true, // callback-url cũng nên là httpOnly
        sameSite: 'lax',
        path: '/',
        secure: false, // false cho HTTP localhost
      },
    },
    csrfToken: {
      // CSRF token thường dùng __Host- nhưng cho localhost thì bỏ prefix
      name: `${adminCookieNameBase}.csrf-token-admin`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // false cho HTTP localhost
      },
    },
    // Có thể thêm state, pkce nếu dùng OAuth providers trong cùng instance này
  },

  session: {
      strategy: "jwt", // Sử dụng JWT làm session strategy
  },

  // --- Callbacks của bạn (giữ nguyên và bổ sung type) ---
  callbacks: {
    async redirect({ url, baseUrl }) {
      console.log('Redirect callback - URL:', url, 'BaseURL:', baseUrl);
      
      // Nếu URL chứa /admin/login, chuyển đến /admin
      if (url.includes('/admin/login') && url.includes('callbackUrl=%2Fadmin')) {
        console.log('Redirect callback - Redirecting to admin dashboard');
        return `${baseUrl}/admin`;
      }
      
      // Nếu URL bắt đầu bằng baseUrl, giữ nguyên URL
      if (url.startsWith(baseUrl)) {
        console.log('Redirect callback - Keeping original URL');
        return url;
      }
      
      // Nếu URL không bắt đầu bằng baseUrl, chuyển đến baseUrl
      console.log('Redirect callback - Redirecting to base URL');
      return baseUrl;
    },

    // Callback này được gọi sau khi authorize thành công
    async signIn({ user, account, profile, email, credentials }) {
        console.log('[AdminAuth] SignIn callback - User data:', user);
        // Kiểm tra bổ sung nếu cần, ví dụ user có bị khóa không
        // Logic này có thể đã được xử lý trong authorize
        const isAdmin = user?.role === 'admin';
        const isActive = (user as any)?.isActive; // Ép kiểu nếu cần

        if (isAdmin && isActive) {
             console.log('[AdminAuth] SignIn callback - Admin is active. Allowing sign in.');
             return true; // Cho phép đăng nhập
        } else {
             console.log(`[AdminAuth] SignIn callback - Denying sign in. isAdmin: ${isAdmin}, isActive: ${isActive}`);
             // Có thể trả về một URL lỗi cụ thể
             // return '/admin/login?error=AccountInactiveOrNotAdmin';
             return false; // Chặn đăng nhập
        }
    },

    // Callback này để thêm thông tin vào JWT token
    async jwt({ token, user, account, profile, isNewUser }) {
      // console.log('[AdminAuth] JWT callback - Initial token:', token);
      // Khi đăng nhập thành công (lần đầu sau authorize), `user` object sẽ có mặt
      if (user) {
        console.log('[AdminAuth] JWT callback - User object present, adding to token:', user);
        token.id = user.id; // Lấy từ object trả về bởi authorize
        token.username = (user as any).username; // Ép kiểu nếu cần
        token.fullName = (user as any).fullName;
        token.role = (user as any).role;
        token.isActive = (user as any).isActive; // Thêm cả trạng thái active
      }
      // console.log('[AdminAuth] JWT callback - Final token:', token);
      return token; // Trả về token đã được cập nhật
    },

    // Callback này để tạo session object gửi về client từ token
    async session({ session, token, user }) {
      // console.log('[AdminAuth] Session callback - Initial session:', session);
      // console.log('[AdminAuth] Session callback - Token received:', token);
      // Gán thông tin từ token vào session.user
      if (token && session.user) {
         console.log('[AdminAuth] Session callback - Adding token data to session.user');
         (session.user as any).id = token.id;
         (session.user as any).username = token.username;
         (session.user as any).fullName = token.fullName;
         (session.user as any).role = token.role;
         (session.user as any).isActive = token.isActive; // Thêm cả trạng thái active
      }
      // console.log('[AdminAuth] Session callback - Final session:', session);
      return session; // Trả về session object hoàn chỉnh
    }
  },

  secret: process.env.NEXTAUTH_SECRET, // Đảm bảo biến này được đặt trong .env

  // Bật debug logs khi ở môi trường development
  debug: process.env.NODE_ENV === 'development',
};