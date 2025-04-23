import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import UserModel from "@/lib/models/User"; // Đảm bảo đường dẫn này đúng
import connectDB from "@/lib/db";       // Đảm bảo đường dẫn này đúng

// *** Đặt tên cookie riêng cho admin (phiên bản localhost) ***
const adminCookieNameBase = 'next-auth-admin'; // Thay đổi tên cơ sở

// --- ĐOẠN CODE HOÀN CHỈNH ĐÃ SỬA LỖI REDIRECT ---

export const adminAuthOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'admin-credentials',
      name: "Admin credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          console.log('[AdminAuth] Starting admin authorization');
          await connectDB();

          if (!credentials) {
            console.log('[AdminAuth] No credentials provided');
            return null;
          }

          console.log('[AdminAuth] Finding admin user:', credentials.username);
          const user = await UserModel.findOne({
            username: credentials.username,
            role: 'admin'
          }).select('+password');

          if (!user || !user.password) {
            console.log('[AdminAuth] Admin user not found or no password');
            return null;
          }

          console.log('[AdminAuth] Checking password');
          const isValid = await bcrypt.compare(credentials.password, user.password);

          if (!isValid) {
            console.log('[AdminAuth] Invalid password');
            return null;
          }

          if (!user.isActive) {
            console.log('[AdminAuth] Admin user is not active');
            return null;
          }

          console.log('[AdminAuth] Admin authorization successful');
          return {
            id: user._id.toString(),
            email: user.email,
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            isActive: user.isActive
          };
        } catch (error) {
          console.error('[AdminAuth] Authorize error:', error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  cookies: {
    sessionToken: {
      name: `${adminCookieNameBase}.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // false cho HTTP localhost
      },
    },
    callbackUrl: {
      name: `${adminCookieNameBase}.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // false cho HTTP localhost
      },
    },
    csrfToken: {
      name: `${adminCookieNameBase}.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // false cho HTTP localhost
      },
    },
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // --- Callback redirect ĐÃ SỬA LỖI ---
    async redirect({ url, baseUrl }) {
      console.log('Redirect callback - Input URL:', url, 'BaseURL:', baseUrl);

      // --- FIX: Xử lý URL tương đối trước khi parse ---
      let urlToParse: string;
      if (url.startsWith('/')) {
        // Nếu là URL tương đối, kết hợp với baseUrl để tạo URL tuyệt đối
        urlToParse = baseUrl + url;
      } else {
        // Nếu không phải, giả sử nó đã là URL tuyệt đối (hoặc để URL constructor xử lý lỗi nếu định dạng sai)
        urlToParse = url;
      }

      let parsedUrl: URL;
      try {
        // Bây giờ việc parse sẽ an toàn hơn
        parsedUrl = new URL(urlToParse);
      } catch (error) {
        console.error(`[AdminAuth] Redirect callback - Lỗi khi parse URL '${urlToParse}' (từ input '${url}'). Chuyển về baseUrl.`, error);
        return baseUrl; // Quay về baseUrl nếu không parse được URL
      }
      // --- END FIX ---

      console.log('[AdminAuth] Redirect callback - Parsed Absolute URL:', parsedUrl.toString());

      // --- Logic xử lý redirect của bạn (giữ nguyên hoặc điều chỉnh nếu cần) ---

      // 1. Ưu tiên trả về callbackUrl nếu có và hợp lệ
      const callbackUrlParam = parsedUrl.searchParams.get('callbackUrl');
      if (callbackUrlParam) {
        console.log('[AdminAuth] Redirect callback - Tìm thấy callbackUrl parameter:', callbackUrlParam);
        // Kiểm tra callbackUrl có hợp lệ không (tương đối hoặc cùng domain)
        if (callbackUrlParam.startsWith('/') || callbackUrlParam.startsWith(baseUrl)) {
          let finalCallbackUrl = callbackUrlParam;
          // Đảm bảo trả về URL tuyệt đối
          if (finalCallbackUrl.startsWith('/')) {
            finalCallbackUrl = baseUrl + finalCallbackUrl;
          }
          console.log(`[AdminAuth] Redirect callback - Chuyển hướng đến callbackUrl hợp lệ: ${finalCallbackUrl}`);
          return finalCallbackUrl;
        } else {
          console.warn(`[AdminAuth] Redirect callback - Bỏ qua callbackUrl không hợp lệ hoặc bên ngoài: ${callbackUrlParam}`);
          // Nếu callbackUrl không hợp lệ, sẽ fallback về logic bên dưới hoặc baseUrl
        }
      }


      // 2. Xử lý chuyển hướng sau khi đăng nhập admin thành công (ví dụ: đến /admin)
      // Logic này dựa vào việc luồng đăng nhập thành công sẽ cố gắng chuyển hướng đến '/admin'
      if (url === '/admin') { // Kiểm tra input gốc `url`
        console.log('[AdminAuth] Redirect callback - Chuyển hướng đăng nhập admin thành công đến dashboard.');
        return `${baseUrl}/admin`; // Trả về URL tuyệt đối của trang admin
      }


      // 3. Xử lý các URL tương đối khác hoặc cùng domain
      // Kiểm tra input gốc `url`
      if (url.startsWith('/') || url.startsWith(baseUrl)) {
        console.log('[AdminAuth] Redirect callback - Giữ URL tương đối/cùng domain (trả về dạng tuyệt đối):', parsedUrl.toString());
        return parsedUrl.toString(); // Trả về URL tuyệt đối đã được parse
      }

      // 4. Mặc định: Nếu là URL bên ngoài hoặc không khớp các trường hợp trên, chuyển về baseUrl
      console.log('[AdminAuth] Redirect callback - Không khớp quy tắc nào, chuyển hướng về baseUrl:', baseUrl);
      return baseUrl;
    },

    // --- Các callbacks khác (signIn, jwt, session) giữ nguyên như trước ---
    async signIn({ user, account, profile, email, credentials }) {
      console.log('[AdminAuth] SignIn callback - User data:', user);
      const isAdmin = user?.role === 'admin';
      const isActive = (user as any)?.isActive === true;

      if (isAdmin && isActive) {
        console.log('[AdminAuth] SignIn callback - Admin is active. Allowing sign in.');
        return true;
      } else {
        console.log(`[AdminAuth] SignIn callback - Denying sign in. isAdmin: ${isAdmin}, isActive: ${isActive}`);
        return false;
      }
    },

    async jwt({ token, user }) {
      if (user) {
        console.log('[AdminAuth] JWT callback - User object present, adding to token:', user);
        token.id = user.id;
        token.username = (user as any).username;
        token.fullName = (user as any).fullName;
        token.role = (user as any).role;
        token.isActive = (user as any).isActive;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        console.log('[AdminAuth] Session callback - Adding token data to session.user');
        (session.user as any).id = token.id;
        (session.user as any).username = token.username;
        (session.user as any).fullName = token.fullName;
        (session.user as any).role = token.role;
        (session.user as any).isActive = token.isActive;
      }
      return session;
    }
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};