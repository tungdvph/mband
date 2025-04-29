// src/app/api/user/me/profile/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { getServerSession } from 'next-auth';
import { publicAuthOptions } from '@/lib/publicAuth'; // Sử dụng public auth cho người dùng tự cập nhật
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose'; // Import mongoose để dùng Types.ObjectId

export async function PUT(request: Request) {
    try {
        // Xác thực người dùng thông thường qua session
        const session = await getServerSession(publicAuthOptions);

        // Kiểm tra session và user tồn tại
        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'Bạn cần đăng nhập để thực hiện thao tác này' },
                { status: 401 } // Unauthorized
            );
        }

        // Lấy ID người dùng từ session một cách an toàn
        // Cần ép kiểu session.user nếu type mặc định không có 'id'
        const userId = (session.user as { id?: string | mongoose.Types.ObjectId })?.id;

        // Kiểm tra userId hợp lệ
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return NextResponse.json(
                { error: 'Không xác định được ID người dùng hợp lệ từ session' },
                { status: 400 } // Bad Request
            );
        }

        // Kết nối cơ sở dữ liệu
        await connectToDatabase();

        // Đọc dữ liệu JSON từ request body
        let body;
        try {
            body = await request.json();
        } catch (jsonError) {
            return NextResponse.json({ error: 'Dữ liệu gửi lên không phải là JSON hợp lệ' }, { status: 400 });
        }

        const { oldPassword, newPassword, ...updateData } = body;

        // --- Lọc các trường không cho phép user tự cập nhật ---
        // Đảm bảo user không thể tự thay đổi các trường nhạy cảm
        delete updateData.username; // Không cho đổi username
        delete updateData.role;     // Chắc chắn không cho tự đổi role
        delete updateData.isActive; // Không cho tự thay đổi trạng thái active
        delete updateData.avatar;   // Route này không xử lý avatar
        delete updateData._id;      // Không cho phép gửi _id trong body
        delete updateData.id;       // Không cho phép gửi id trong body

        // --- Xử lý đổi mật khẩu ---
        if (newPassword) {
            // Nếu có mật khẩu mới, phải có mật khẩu cũ
            if (!oldPassword) {
                return NextResponse.json({ error: 'Vui lòng nhập mật khẩu cũ để đặt mật khẩu mới' }, { status: 400 });
            }

            // Tìm user và lấy cả password hash để so sánh
            // Sử dụng select('+password') để lấy trường password dù nó bị ẩn mặc định trong schema
            const user = await User.findById(userId).select('+password');

            // Kiểm tra user có tồn tại và có password không (tránh trường hợp user đăng nhập qua OAuth)
            if (!user || !user.password) {
                return NextResponse.json({ error: 'Không tìm thấy người dùng hoặc tài khoản này không sử dụng mật khẩu' }, { status: 404 });
            }

            // So sánh mật khẩu cũ người dùng nhập với hash trong DB
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return NextResponse.json({ error: 'Mật khẩu cũ không chính xác' }, { status: 400 });
            }

            // Nếu mật khẩu cũ khớp, hash mật khẩu mới và thêm vào dữ liệu cập nhật
            updateData.password = await bcrypt.hash(newPassword, 12); // Sử dụng salt rounds phù hợp
        } else if (oldPassword && !newPassword) {
            // Nếu chỉ cung cấp mật khẩu cũ mà không có mật khẩu mới, có thể bỏ qua hoặc thông báo nhẹ nhàng
            console.log(`User ${userId} provided old password without a new one.`);
            // Hoặc return lỗi nếu muốn bắt buộc phải có newPassword khi có oldPassword
            // return NextResponse.json({ error: 'Vui lòng cung cấp mật khẩu mới' }, { status: 400 });
        }

        // --- Thực hiện cập nhật trong cơ sở dữ liệu ---
        // Chỉ cập nhật các trường trong updateData (fullName, email, password nếu có)
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            {
                new: true, // Trả về document sau khi đã cập nhật
                runValidators: true, // Chạy các validation đã định nghĩa trong Mongoose Schema
                context: 'query' // Cần thiết cho một số validators phức tạp
            }
        ).select('-password'); // Luôn loại bỏ password khỏi kết quả trả về client

        // Kiểm tra xem việc cập nhật có thành công không
        if (!updatedUser) {
            // Có thể do lỗi mạng hoặc user ID không còn tồn tại (dù đã check session)
            return NextResponse.json({ error: 'Không thể cập nhật thông tin người dùng' }, { status: 404 });
        }

        // Trả về thông tin người dùng đã được cập nhật (không bao gồm mật khẩu)
        return NextResponse.json(updatedUser);

    } catch (error: any) {
        console.error('API Error - /api/user/me/profile [PUT]:', error);

        // Xử lý lỗi validation từ Mongoose
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map((el: any) => el.message);
            return NextResponse.json({ error: 'Dữ liệu không hợp lệ', details: errors }, { status: 400 });
        }
        // Xử lý lỗi trùng lặp key (ví dụ: email đã tồn tại)
        if (error.code === 11000) {
            // Xác định trường bị trùng lặp từ thông báo lỗi hoặc keyValue
            const field = Object.keys(error.keyValue)[0];
            return NextResponse.json({ error: `Thông tin '${field}' (${error.keyValue[field]}) đã được sử dụng.` }, { status: 409 }); // 409 Conflict
        }

        // Lỗi chung của server
        return NextResponse.json({ error: 'Lỗi máy chủ nội bộ khi xử lý yêu cầu của bạn' }, { status: 500 });
    }
}