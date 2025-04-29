import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { getServerSession } from 'next-auth';
import { publicAuthOptions } from '@/lib/publicAuth';
import bcrypt from 'bcrypt'; // Thêm dòng này

export async function PUT(request: Request) {
    try {
        const session = await getServerSession(publicAuthOptions);
        
        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'Bạn không có quyền thực hiện thao tác này' }, 
                { status: 401 }
            );
        }

        await connectToDatabase();
        const { userId, oldPassword, newPassword, ...updateData } = await request.json();

        // Kiểm tra mật khẩu cũ nếu có thay đổi mật khẩu
        if (newPassword) {
            const user = await User.findById(userId).select('+password');
            if (!user) {
                return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });
            }
            
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return NextResponse.json({ error: 'Mật khẩu cũ không đúng' }, { status: 400 });
            }

            // Hash mật khẩu mới
            const hashedPassword = await bcrypt.hash(newPassword, 12);
            updateData.password = hashedPassword;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });
        }

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json({ error: 'Lỗi cập nhật người dùng' }, { status: 500 });
    }
}