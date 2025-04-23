import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

// *** Lấy tên cookie admin ĐÚNG như đã định nghĩa trong adminAuthOptions ***
// Tên cơ sở là 'next-auth-admin', tên token là '.session-token'
const adminCookieName = `next-auth-admin.session-token`; // <--- SỬA LẠI TÊN Ở ĐÂY

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isAdminRoute = path.startsWith('/admin');
  const isAdminLoginPage = path === '/admin/login';

  // Bỏ qua các API route của NextAuth và các tài nguyên tĩnh
  // Quan trọng: Đảm bảo bao gồm cả API route của admin và public nếu chúng bắt đầu bằng /api/
  if (path.startsWith('/api/') || path.startsWith('/_next/') || path.includes('.')) {
    return NextResponse.next();
  }

  // --- Chỉ xử lý logic bảo vệ cho các trang GIAO DIỆN admin ---
  if (isAdminRoute) {
    // *** Đọc token admin từ cookie cụ thể ***
    console.log(`[Middleware] Checking admin route: ${path}. Using cookie: ${adminCookieName}`); // Thêm log
    const adminToken = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,        // Phải khớp secret
      cookieName: adminCookieName,                // *** Đã sửa dùng đúng tên cookie admin ***
      // secureCookie: false cho HTTP localhost, true cho HTTPS production
      secureCookie: process.env.NODE_ENV === 'production',
    });
    console.log('[Middleware] Admin Token:', adminToken); // Log kết quả getToken

    // 1. Nếu KHÔNG CÓ token admin VÀ đang cố truy cập trang admin (KHÔNG phải trang login)
    if (!adminToken && !isAdminLoginPage) {
      console.log('[Middleware] No admin token and not on login page. Redirecting to login.');
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('callbackUrl', path + req.nextUrl.search); // Giữ lại query params
      return NextResponse.redirect(loginUrl);
    }

    // 2. Nếu CÓ token NHƯNG KHÔNG phải role 'admin' VÀ đang cố truy cập trang admin (KHÔNG phải trang login)
    if (adminToken && adminToken.role !== 'admin' && !isAdminLoginPage) {
      console.log(`[Middleware] Token found but invalid role (${adminToken.role}). Redirecting to login with error.`);
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('error', 'UnauthorizedRole'); // Thêm thông báo lỗi
      return NextResponse.redirect(loginUrl);
    }

    // 3. Nếu ĐÃ ĐĂNG NHẬP admin (có token, đúng role) VÀ đang truy cập trang login admin
    if (adminToken && adminToken.role === 'admin' && isAdminLoginPage) {
      console.log('[Middleware] Admin already logged in, redirecting from login page.');
      const callbackUrl = req.nextUrl.searchParams.get('callbackUrl');
      // Chuyển hướng đến callbackUrl hoặc trang dashboard admin mặc định
      const redirectPath = callbackUrl && callbackUrl.startsWith('/') ? callbackUrl : '/admin';
      console.log(`[Middleware] Redirecting logged-in admin to: ${redirectPath}`);
      return NextResponse.redirect(new URL(redirectPath, req.url));
    }

    // 4. Các trường hợp hợp lệ khác (có token admin, đúng role, truy cập trang admin không phải login) -> Cho phép
    console.log('[Middleware] Valid admin access. Allowing request.');
  }

  // Nếu không phải route admin hoặc đã qua các kiểm tra, cho phép request tiếp tục
  // console.log(`[Middleware] Path ${path} is not an admin route or checks passed. Allowing.`);
  return NextResponse.next();
}

// --- Cấu hình Matcher (Giữ nguyên) ---
export const config = {
  /*
   * Matcher áp dụng middleware này cho TẤT CẢ các route bắt đầu bằng /admin,
   * BAO GỒM cả trang /admin/login và trang gốc /admin.
   * Nó KHÔNG áp dụng cho các route API (/api/...) hoặc các tài nguyên tĩnh (_next/static, _next/image, favicon.ico).
   * Lưu ý: Logic trong middleware đã bỏ qua /api/ nên không cần loại trừ nó khỏi matcher nữa.
   */
  matcher: ['/admin/:path*'], // :path* bao gồm cả trang gốc /admin và các trang con
};