import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import path from 'path';
import { promises as fs } from 'fs';

export const runtime = 'nodejs';

interface UserData {
    username?: string;
    email?: string;
    password?: string;
    fullName?: string;
    role: 'user' | 'admin';
    isActive: boolean;
    avatar?: string;
}

export async function POST(request: Request) {
    try {
        await connectToDatabase();
        const formData = await request.formData();

        const userData: UserData = {
            username: formData.get('username')?.toString() || '',
            email: formData.get('email')?.toString() || '',
            password: formData.get('password')?.toString() || '',
            fullName: formData.get('fullName')?.toString() || '',
            role: (formData.get('role')?.toString() as 'user' | 'admin') || 'user',
            isActive: formData.get('isActive') === 'true',
        };

        // Validate required fields
        if (!userData.username || !userData.email || !userData.password || !userData.fullName) {
            return NextResponse.json({ 
                error: 'Vui lòng điền đầy đủ thông tin bắt buộc' 
            }, { status: 400 });
        }

        const imageFile = formData.get('file') as File;
        if (imageFile?.size > 0) {
            const imageBytes = await imageFile.arrayBuffer();
            const imageBuffer = Buffer.from(imageBytes);
            const imagePath = `/upload/user/${Date.now()}_${imageFile.name}`;
            const fullImagePath = path.join(process.cwd(), 'public', imagePath);
            await fs.mkdir(path.dirname(fullImagePath), { recursive: true });
            await fs.writeFile(fullImagePath, imageBuffer);
            userData.avatar = imagePath;
        } else {
            userData.avatar = '/default-avatar.png';
        }

        if (userData.password) {
            userData.password = await bcrypt.hash(userData.password, 12);
        }

        const user = new User(userData);
        const savedUser = await user.save();
        const userObject = savedUser.toObject();

        return NextResponse.json({
            user: {
                ...userObject,
                _id: (userObject._id as mongoose.Types.ObjectId).toString(),
            }
        });
    } catch (error: any) {
        console.error('Create user error:', error);
        if (error.code === 11000) {
            return NextResponse.json({ 
                error: 'Email hoặc tên đăng nhập đã tồn tại' 
            }, { status: 400 });
        }
        return NextResponse.json({ error: 'Lỗi khi tạo người dùng' }, { status: 500 });
    }
}

export async function GET() {
    try {
        await connectToDatabase();
        const users = await User.find().lean();

        const transformedUsers = users.map(user => ({
            ...user,
            _id: (user._id as mongoose.Types.ObjectId).toString(),
            avatar: user.avatar && user.avatar.startsWith('/upload/user')
                ? user.avatar
                : '/default-avatar.png'
        }));

        return NextResponse.json(transformedUsers);
    } catch (error) {
        return NextResponse.json({ error: 'Lỗi khi lấy danh sách người dùng' }, { status: 500 });
    }
}