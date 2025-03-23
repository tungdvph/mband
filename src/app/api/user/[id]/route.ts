// Tạo file mới này để xử lý PUT request
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface UpdateData {
    username: string | null;
    email: string | null;
    fullName: string | null;
    role: string | null;
    isActive: boolean;
    updatedAt: Date;
    avatar?: string;
    password?: string;
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { db } = await connectToDatabase();
        const formData = await request.formData();

        const updateData: Partial<UpdateData> = {
            username: formData.get('username')?.toString() || null,
            email: formData.get('email')?.toString() || null,
            fullName: formData.get('fullName')?.toString() || null,
            role: formData.get('role')?.toString() || null,
            isActive: formData.has('isActive'), // Sửa lại cách check isActive
            updatedAt: new Date()
        };

        // Chỉ cập nhật avatar nếu có avatar mới
        const avatar = formData.get('avatar')?.toString();
        if (avatar) {
            updateData.avatar = avatar;
        }

        // Chỉ cập nhật password nếu có password mới
        const password = formData.get('password')?.toString();
        if (password) {
            updateData.password = password;
        }

        const result = await db.collection('users').findOneAndUpdate(
            { _id: new ObjectId(params.id) },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        if (!result) {
            return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });
        }

        return NextResponse.json({ 
            user: {
                ...result,
                avatar: result.avatar || '/default-avatar.png'
            }
        });

    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json({ error: 'Lỗi cập nhật người dùng' }, { status: 500 });
    }
}