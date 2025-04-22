import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

// *** Lấy tên cookie admin đã định nghĩa trong adminAuth.ts (phiên bản localhost) ***
const adminCookieName = `next-auth.session-token-admin`;

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isAdminRoute = path.startsWith('/admin');
  const isAdminLoginPage = path === '/admin/login';
  const isAdminApiRoute = path.startsWith('/api/admin'); // Bắt cả API của admin
  const isPublicApiRoute = path.startsWith('/api/');    // Bắt các API khác (bao gồm cả /api/auth)

  // --- Cho phép các request đến API routes đi qua middleware này ---
  // Middleware KHÔNG nên chặn các API endpoint của NextAuth
  if (isAdminApiRoute || isPublicApiRoute) {
    // console.log(`[Middleware] Allowing API route: ${path}`);
    return NextResponse.next();
  }

  // --- Chỉ xử lý logic bảo vệ cho các trang admin ---
  if (isAdminRoute) {
    // console.log(`[Middleware] Processing admin route: ${path}`);

    // *** Đọc token admin từ cookie cụ thể ***
    const adminToken = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,  // Phải khớp secret trong adminAuthOptions
      cookieName: adminCookieName,          // *** Dùng đúng tên cookie admin ***
      secureCookie: false,                  // *** false cho HTTP localhost ***
    });

    // console.log(`[Middleware] Admin Token (${adminCookieName}):`, adminToken);

    // 1. Nếu KHÔNG CÓ token admin VÀ đang cố truy cập trang admin (KHÔNG phải trang login)
    if (!adminToken && !isAdminLoginPage) {
      console.log(`[Middleware] No admin token for path ${path}. Redirecting to /admin/login.`);
      const loginUrl = new URL('/admin/login', req.url);
      // Thêm callbackUrl để quay lại trang này sau khi login
      loginUrl.searchParams.set('callbackUrl', path + req.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }

    // 2. Nếu CÓ token NHƯNG KHÔNG phải role 'admin' VÀ đang cố truy cập trang admin (KHÔNG phải trang login)
    if (adminToken && adminToken.role !== 'admin' && !isAdminLoginPage) {
      console.log(`[Middleware] Token found but not admin role (${adminToken.role}) for path ${path}. Redirecting to home.`);
      // Chuyển hướng về trang chủ public (theo logic cũ của bạn)
      // Bạn cũng có thể cân nhắc chuyển về /admin/login với thông báo lỗi
      return NextResponse.redirect(new URL('/', req.url));
    }

    // 3. Nếu ĐÃ ĐĂNG NHẬP admin (có token, đúng role) VÀ đang truy cập trang login admin
    if (adminToken && adminToken.role === 'admin' && isAdminLoginPage) {
      console.log(`[Middleware] Admin already logged in. Redirecting from /admin/login.`);
      // Lấy callbackUrl từ query params (nếu có, ví dụ từ lần redirect trước đó)
      const callbackUrl = req.nextUrl.searchParams.get('callbackUrl');
      // Chuyển hướng đến callbackUrl hoặc trang dashboard admin mặc định
      const redirectUrl = callbackUrl ? new URL(callbackUrl, req.url) : new URL('/admin', req.url);
      return NextResponse.redirect(redirectUrl);
    }

    // 4. Nếu CÓ token admin, đúng role VÀ đang truy cập trang admin (KHÔNG phải trang login)
    // -> Cho phép truy cập (rơi xuống return NextResponse.next() cuối cùng)
    // console.log(`[Middleware] Admin access allowed for path ${path}`);
  }

  // Nếu không phải route admin hoặc đã qua các kiểm tra ở trên, cho phép request tiếp tục
  // console.log(`[Middleware] Allowing non-admin route or passed checks: ${path}`);
  return NextResponse.next();
}

// --- Cấu hình Matcher ---
export const config = {
  /*
   * Matcher áp dụng middleware này cho TẤT CẢ các route bắt đầu bằng /admin,
   * BAO GỒM cả trang /admin/login và trang gốc /admin.
   * Nó KHÔNG áp dụng cho các route API (/api/...) hoặc các tài nguyên tĩnh (_next/static, _next/image, favicon.ico).
   */
  matcher: ['/admin/:path*'], // :path* bao gồm cả trang gốc /admin và các trang con
};