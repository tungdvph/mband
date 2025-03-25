import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { unlink } from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        await connectToDatabase();
        const updateData = await request.json();

        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 12);
        }

        // Xử lý avatar path khi update
        if (updateData.avatar && !updateData.avatar.startsWith('/default-avatar')) {
            updateData.avatar = `/upload/user/${path.basename(updateData.avatar)}`;
        }

        const result = await User.findByIdAndUpdate(
            params.id,
            {
                ...updateData,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!result) {
            return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });
        }

        const userObject = result.toObject();

        return NextResponse.json({ 
            user: {
                ...userObject,
                _id: (userObject._id as mongoose.Types.ObjectId).toString(),
                avatar: userObject.avatar || '/default-avatar.png'
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

        // Xóa file avatar nếu không phải default avatar
        if (user.avatar && !user.avatar.includes('default-avatar')) {
            try {
                const avatarPath = path.join(process.cwd(), 'public', user.avatar);
                await unlink(avatarPath);
            } catch (error) {
                console.error('Lỗi khi xóa file avatar:', error);
            }
        }

        await user.deleteOne();
        return NextResponse.json({ success: true, message: 'Đã xóa người dùng thành công' });
    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json({ error: 'Lỗi khi xóa người dùng' }, { status: 500 });
    }
}