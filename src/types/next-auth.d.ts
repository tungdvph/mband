// next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Mở rộng kiểu User gốc để thêm các trường tùy chỉnh
   */
  interface User extends DefaultUser {
    // Các trường bạn đã định nghĩa
    id: string;
    username: string;
    email: string; // email đã có trong DefaultUser, nhưng ghi đè để đảm bảo kiểu string
    fullName: string;
    role: string; // Nên sử dụng kiểu cụ thể hơn nếu có thể, ví dụ: 'user' | 'admin'
    _id: string;
    // Thêm trường isActive đã sử dụng trong callbacks
    isActive?: boolean;
    // Thêm các trường khác từ model nếu cần dùng trong session/token
    // avatar?: string | null;
  }

  /**
   * Mở rộng kiểu Session gốc
   */
  interface Session extends DefaultSession {
    /**
     * Kiểu `user` trong Session giờ đây sẽ bao gồm các trường tùy chỉnh của bạn
     * và các trường mặc định (`name`, `image`).
     * Cho phép `null` để xử lý trường hợp lỗi fetch user từ DB.
     */
    user?: (User & {
      // Giữ lại các trường mặc định có thể có từ DefaultSession['user']
      name?: string | null | undefined;
      email?: string | null | undefined;
      image?: string | null | undefined;
    }) | null; // <<< Cho phép user là null
  }
}

declare module "next-auth/jwt" {
  /**
   * Mở rộng kiểu JWT gốc
   */
  interface JWT extends DefaultJWT {
    /** Thêm trường `sub` (subject - user ID) mà chúng ta sử dụng */
    sub: string;
    /** Thêm các trường khác bạn CÓ THỂ đã lưu vào token (nếu có) */
    // Ví dụ:
    // role?: string;
    // username?: string;
  }
}