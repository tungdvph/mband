// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db'; // Đảm bảo đường dẫn đúng
import User from '@/lib/models/User'; // Đảm bảo đường dẫn đúng
// import { generateToken } from '@/lib/utils/auth'; // Bỏ import nếu không dùng token ở đây
import mongoose from 'mongoose';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { username, email, password, fullName } = await req.json();

    // --- Validation cơ bản phía server ---
    if (!username || !email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ thông tin bắt buộc.' },
        { status: 400 }
      );
    }
    if (username.includes(' ')) {
      return NextResponse.json(
        { error: 'Tên đăng nhập không được chứa khoảng trắng.' },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu phải từ 6 ký tự trở lên.' },
        { status: 400 }
      );
    }
    if (password.includes(' ')) {
      return NextResponse.json(
        { error: 'Mật khẩu không được chứa khoảng trắng.' },
        { status: 400 }
      );
    }
    // Kiểm tra định dạng email cơ bản
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Định dạng email không hợp lệ.' },
        { status: 400 }
      );
    }
    // --- Kết thúc validation server ---


    // 1. Kiểm tra Tên đăng nhập đã tồn tại (Thêm bước này)
    // Sử dụng regex không phân biệt chữ hoa/thường để kiểm tra username
    const existingUsername = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
    if (existingUsername) {
      return NextResponse.json(
        { error: 'Tên đăng nhập đã được sử dụng' }, // Thông báo lỗi cụ thể
        { status: 400 } // Status 400 Bad Request thường dùng cho lỗi validation hoặc dữ liệu trùng lặp
      );
    }

    // 2. Kiểm tra Email đã tồn tại
    // Sử dụng regex không phân biệt chữ hoa/thường để kiểm tra email
    const existingEmail = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email đã được sử dụng' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12); // Nên dùng salt rounds là 10 hoặc 12

    // Tạo user mới
    const newUser = await User.create({
      username: username, // Lưu username gốc (có thể là chữ hoa/thường)
      email: email.toLowerCase(), // Luôn lưu email dạng chữ thường để tránh trùng lặp do phân biệt hoa/thường
      password: hashedPassword,
      fullName: fullName,
      role: 'user' // Mặc định role là user
    });

    // // ----- Phần trả về Token (nếu bạn muốn tự động đăng nhập sau khi đăng ký) -----
    // // Chuyển đổi kiểu dữ liệu nếu cần generateToken
    // const userObjectForToken = {
    //   _id: (newUser._id as mongoose.Types.ObjectId).toString(),
    //   role: newUser.role as 'user' | 'admin',
    //   username: newUser.username, // Thêm các thông tin cần thiết khác vào token
    //   email: newUser.email
    // };
    // // Tạo token
    // const token = generateToken(userObjectForToken);
    // // Trả về token
    // return NextResponse.json({
    //     message: 'Đăng ký thành công',
    //     token: token, // Trả token để client có thể lưu và tự động đăng nhập
    //     user: { // Có thể trả về một số thông tin user không nhạy cảm
    //         id: userObjectForToken._id,
    //         username: userObjectForToken.username,
    //         email: userObjectForToken.email,
    //         fullName: newUser.fullName,
    //         role: userObjectForToken.role
    //     }
    // }, { status: 201 }); // Status 201 Created thường dùng khi tạo tài nguyên mới thành công

    // ----- Hoặc chỉ trả về thông báo thành công (nếu yêu cầu đăng nhập lại sau khi đăng ký) -----
    return NextResponse.json(
      { message: 'Đăng ký tài khoản thành công!' },
      { status: 201 } // 201 Created
    );


  } catch (error) {
    console.error('Registration API error:', error);
    // Xử lý lỗi cụ thể của Mongoose (ví dụ: lỗi validation schema)
    if (error instanceof mongoose.Error.ValidationError) {
      // Lấy thông báo lỗi đầu tiên từ danh sách lỗi validation
      const messages = Object.values(error.errors).map(e => e.message);
      return NextResponse.json({ error: messages.join(', ') }, { status: 400 });
    }
    // Lỗi chung
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi phía máy chủ khi đăng ký.' },
      { status: 500 } // 500 Internal Server Error
    );
  }
}