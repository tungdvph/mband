import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

// *** Lấy tên cookie admin đã định nghĩa trong adminAuth.ts (phiên bản localhost) ***
const adminCookieName = `next-auth.session-token-admin`;

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isAdminRoute = path.startsWith('/admin');
  const isAdminLoginPage = path === '/admin/login';

  // Bỏ qua các API route của NextAuth và các tài nguyên tĩnh
  if (path.startsWith('/api/') || path.startsWith('/_next/') || path.includes('.')) {
    return NextResponse.next();
  }

  // --- Chỉ xử lý logic bảo vệ cho các trang GIAO DIỆN admin ---
  if (isAdminRoute) {
    // *** Đọc token admin từ cookie cụ thể ***
    const adminToken = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,      // Phải khớp secret
      cookieName: adminCookieName,              // *** Dùng đúng tên cookie admin ***
      // secureCookie: false cho HTTP localhost, true cho HTTPS production
      secureCookie: process.env.NODE_ENV === 'production',
    });

    // 1. Nếu KHÔNG CÓ token admin VÀ đang cố truy cập trang admin (KHÔNG phải trang login)
    if (!adminToken && !isAdminLoginPage) {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('callbackUrl', path + req.nextUrl.search); // Giữ lại query params
      return NextResponse.redirect(loginUrl);
    }

    // 2. Nếu CÓ token NHƯNG KHÔNG phải role 'admin' VÀ đang cố truy cập trang admin (KHÔNG phải trang login)
    if (adminToken && adminToken.role !== 'admin' && !isAdminLoginPage) {
      // Redirect về trang login admin với thông báo lỗi rõ ràng
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('error', 'UnauthorizedRole'); // Thêm thông báo lỗi
      return NextResponse.redirect(loginUrl);
    }

    // 3. Nếu ĐÃ ĐĂNG NHẬP admin (có token, đúng role) VÀ đang truy cập trang login admin
    if (adminToken && adminToken.role === 'admin' && isAdminLoginPage) {
      const callbackUrl = req.nextUrl.searchParams.get('callbackUrl');
      // Chuyển hướng đến callbackUrl hoặc trang dashboard admin mặc định
      const redirectPath = callbackUrl && callbackUrl.startsWith('/') ? callbackUrl : '/admin';
      return NextResponse.redirect(new URL(redirectPath, req.url));
    }

    // 4. Các trường hợp hợp lệ khác (có token admin, đúng role, truy cập trang admin không phải login) -> Cho phép
  }

  // Nếu không phải route admin hoặc đã qua các kiểm tra, cho phép request tiếp tục
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