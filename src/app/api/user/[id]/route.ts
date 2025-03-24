import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { unlink } from 'fs/promises';
import path from 'path';

interface UpdateUserData {
    username?: string;
    email?: string;
    fullName?: string;
    role?: string;
    isActive: boolean;
    updatedAt: Date;
    avatar?: string;
    password?: string;
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        await connectToDatabase();
        const formData = await request.formData();

        const updateData: UpdateUserData = {
            username: formData.get('username')?.toString() || undefined,
            email: formData.get('email')?.toString() || undefined,
            fullName: formData.get('fullName')?.toString() || undefined,
            role: formData.get('role')?.toString() || undefined,
            isActive: formData.has('isActive'),
            updatedAt: new Date()
        };

        if (formData.get('avatar')) {
            updateData.avatar = formData.get('avatar')?.toString();
        }

        if (formData.get('password')) {
            updateData.password = formData.get('password')?.toString();
        }

        const result = await User.findByIdAndUpdate(
            params.id,
            updateData,
            { new: true }
        );

        if (!result) {
            return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });
        }

        return NextResponse.json({ 
            user: {
                ...result.toObject(),
                avatar: result.avatar || '/default-avatar.png'
            }
        });
    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json({ error: 'Lỗi cập nhật người dùng' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        await connectToDatabase();
        const user = await User.findById(params.id);

        if (!user) {
            return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });
        }

        // Sửa lại phần kiểm tra và xóa file ảnh
        if (user.avatar && !user.avatar.includes('default-avatar.png')) {
            try {
                const avatarPath = path.join(process.cwd(), 'public', 'upload', 'user', path.basename(user.avatar));
                await unlink(avatarPath);
                console.log('Đã xóa file avatar:', avatarPath);
            } catch (error) {
                console.log('Lỗi khi xóa file avatar:', error);
            }
        }

        await user.deleteOne();
        return NextResponse.json({ success: true, message: 'Đã xóa người dùng thành công' });
    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json({ error: 'Lỗi khi xóa người dùng' }, { status: 500 });
    }
}