import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { unlink, mkdir, writeFile } from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user || session.user.role !== 'admin') {
            return NextResponse.json(
                { error: 'Bạn không có quyền thực hiện thao tác này' }, 
                { status: 401 }
            );
        }

        await connectToDatabase();
        
        // Đọc FormData thay vì json
        const formData = await request.formData();
        const updateData: any = {};

        // Xử lý các trường dữ liệu từ form
        formData.forEach((value, key) => {
            if (key === 'file' && value instanceof File && value.size > 0) {
                // Xử lý file upload
                // Lưu ý: Cần thêm logic xử lý file ở đây
            } else if (key === 'isActive') {
                updateData[key] = value === 'true';
            } else if (key !== '_id' && value) {
                updateData[key] = value;
            }
        });

        // Xử lý password nếu có
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 12);
        }

        // Xử lý file avatar nếu có
        const file = formData.get('file') as File | null;
        if (file && file.size > 0) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            
            const fileName = `${Date.now()}-${file.name}`;
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'users');
            
            await mkdir(uploadDir, { recursive: true });
            await writeFile(path.join(uploadDir, fileName), buffer);
            updateData.avatar = `/uploads/users/${fileName}`;
        }

        const result = await User.findByIdAndUpdate(
            params.id,
            {
                ...updateData,
                updatedAt: new Date()
            },
            { new: true }
        ).select('-password');

        if (!result) {
            return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });
        }

        return NextResponse.json({ 
            user: {
                ...result.toObject(),
                _id: result._id.toString()
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