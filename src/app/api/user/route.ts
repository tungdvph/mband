import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import UserModel from '@/lib/models/User';
import { getServerSession } from 'next-auth';
import { adminAuthOptions } from '@/lib/adminAuth';  // Sửa dòng này
import path from 'path';
import * as fs from 'fs/promises';

// Endpoint cho người dùng thông thường đăng ký
export async function POST(req: Request) {
  try {
    await connectDB();
    
    const { username, email, password, fullName, role, isActive } = await req.json();

    if (!username || !email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    const existingUser = await UserModel.findOne({ 
      $or: [{ email }, { username }] 
    });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email hoặc tên đăng nhập đã được sử dụng' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new UserModel({
      username,
      email,
      password: hashedPassword,
      fullName,
      role: role || 'user',
      isActive: isActive ?? true,
      avatar: '/default-avatar.png'
    });

    await newUser.save();

    return NextResponse.json({
      message: 'Tạo người dùng thành công',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        isActive: newUser.isActive,
        avatar: newUser.avatar
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Lỗi khi tạo người dùng mới' },
      { status: 500 }
    );
  }
}

// Endpoint cho admin tạo người dùng mới
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(adminAuthOptions);  // Sửa dòng này
    
    // Kiểm tra session và role kỹ hơn
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Bạn không có quyền thực hiện thao tác này' }, 
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    let avatarPath = '/default-avatar.png';
    
    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const fileName = `${Date.now()}-${file.name}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'users');
      
      await fs.mkdir(uploadDir, { recursive: true });
      await fs.writeFile(path.join(uploadDir, fileName), buffer);
      avatarPath = `/uploads/users/${fileName}`;
    } else {
      const avatarFromForm = formData.get('avatar');
      avatarPath = avatarFromForm ? String(avatarFromForm) : '/default-avatar.png';
    }

    const password = formData.get('password');
    let hashedPassword: string | undefined;
    
    if (password && typeof password === 'string' && password.length > 0) {
      hashedPassword = await bcrypt.hash(password, 12);
    }

    const userData = {
      username: String(formData.get('username')),
      email: String(formData.get('email')),
      fullName: String(formData.get('fullName')),
      role: String(formData.get('role')) || 'user',
      isActive: formData.get('isActive') === 'true',
      avatar: avatarPath,
      ...(hashedPassword ? { password: hashedPassword } : {})
    };

    const newUser = await UserModel.create(userData);

    const userResponse = {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      isActive: newUser.isActive,
      avatar: newUser.avatar
    };

    return NextResponse.json(userResponse, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Lỗi khi tạo người dùng mới' },
      { status: 500 }
    );
  }
}

// Add this GET handler at the top of the file
export async function GET() {
  try {
    const session = await getServerSession(adminAuthOptions);  // Sửa dòng này
    
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const users = await UserModel.find({}).select('-password');

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy danh sách người dùng' },
      { status: 500 }
    );
  }
}