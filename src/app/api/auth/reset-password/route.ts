import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
// import crypto from 'crypto'; // Cần nếu bạn hash token ở bước forgot-password

export async function POST(req: Request) {
    try {
        await connectDB();
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json({ error: 'Thiếu thông tin token hoặc mật khẩu mới.' }, { status: 400 });
        }

        // Validation mật khẩu mới
        if (password.length < 6) {
            return NextResponse.json({ error: 'Mật khẩu phải từ 6 ký tự trở lên.' }, { status: 400 });
        }
        if (/\s/.test(password)) {
            return NextResponse.json({ error: 'Mật khẩu không được chứa khoảng trắng.' }, { status: 400 });
        }

        // Tìm user bằng token VÀ token chưa hết hạn
        // Nếu bạn đã hash token ở forgot-password, bạn cần hash token đến ở đây trước khi tìm
        // const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            resetPasswordToken: token, // Hoặc hashedToken
            resetPasswordExpires: { $gt: Date.now() } // Chỉ tìm token còn hạn
        }).select('+password'); // Chọn cả trường password để so sánh nếu cần

        if (!user) {
            return NextResponse.json({ error: 'Token không hợp lệ hoặc đã hết hạn.' }, { status: 400 });
        }

        // Hash mật khẩu mới
        const hashedPassword = await bcrypt.hash(password, 12);

        // Cập nhật mật khẩu và xóa thông tin token
        user.password = hashedPassword;
        user.resetPasswordToken = undefined; // Xóa token
        user.resetPasswordExpires = undefined; // Xóa thời gian hết hạn
        await user.save();

        // (Tùy chọn) Gửi email thông báo mật khẩu đã được thay đổi

        return NextResponse.json({ message: 'Đặt lại mật khẩu thành công!' }, { status: 200 });

    } catch (error) {
        console.error('Reset Password API error:', error);
        return NextResponse.json({ error: 'Đã xảy ra lỗi phía máy chủ khi đặt lại mật khẩu.' }, { status: 500 });
    }
}