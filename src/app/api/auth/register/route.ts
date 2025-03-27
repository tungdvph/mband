import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { generateToken } from '@/lib/utils/auth';
import mongoose from 'mongoose';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { username, email, password, fullName } = await req.json();

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email đã được sử dụng' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Tạo user mới
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      fullName,
      role: 'user'
    });

    // Chuyển đổi kiểu dữ liệu
    const userObject = {
      _id: (user._id as mongoose.Types.ObjectId).toString(),
      role: user.role as 'user' | 'admin'
    };

    // Tạo token
    const token = generateToken(userObject);

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Đăng ký thất bại' },
      { status: 500 }
    );
  }
}