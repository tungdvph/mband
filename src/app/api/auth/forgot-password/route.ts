import { NextResponse } from 'next/server';
import crypto from 'crypto'; // Module có sẵn trong Node.js
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { sendPasswordResetEmail } from '@/lib/utils/email'; // Hàm gửi email bạn cần tạo

export async function POST(req: Request) {
    try {
        await connectDB();
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Vui lòng nhập email.' }, { status: 400 });
        }

        // Tìm user bằng email (không phân biệt hoa thường)
        const user = await User.findOne({ email: email.toLowerCase() });

        // Quan trọng: Dù có tìm thấy user hay không, vẫn trả về thông báo thành công chung chung
        // để tránh kẻ xấu dò xem email nào đã đăng ký. Việc gửi email chỉ xảy ra nếu user tồn tại.
        if (user) {
            // 1. Tạo Reset Token
            const resetToken = crypto.randomBytes(20).toString('hex');

            // 2. Mã hóa nhẹ token trước khi lưu vào DB (tùy chọn, tăng bảo mật nếu DB bị lộ)
            // const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

            // 3. Lưu token và thời gian hết hạn ( 1 giờ)
            user.resetPasswordToken = resetToken; // Lưu token gốc hoặc hashedToken
            user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 giờ = 3600000ms
            await user.save();

            // 4. Tạo URL Reset
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL; // Lấy giá trị từ biến môi trường

            // Rất quan trọng: Kiểm tra xem biến môi trường có tồn tại không
            if (!baseUrl) {
                console.error("LỖI: Biến môi trường NEXT_PUBLIC_BASE_URL chưa được thiết lập!");
                // Bạn nên trả về lỗi 500 ở đây vì đây là lỗi cấu hình server
                return NextResponse.json({ error: 'Lỗi cấu hình máy chủ. Không thể tạo URL đặt lại mật khẩu.' }, { status: 500 });
            }

            // ******** ĐÂY LÀ DÒNG ĐÃ ĐƯỢC SỬA ********
            // Sử dụng template literal (dấu `) và cú pháp ${variable} để ghép chuỗi và biến
            const resetUrl = `${baseUrl}/reset-password/${resetToken}`;
            // ******** HẾT PHẦN SỬA ********

            // 5. Gửi email (bất đồng bộ, không cần đợi)
            try {
                // Truyền resetUrl đã được tạo đúng
                await sendPasswordResetEmail(user.email, user.fullName || 'bạn', resetUrl);
                console.log(`Password reset email sent successfully to ${user.email}`);
            } catch (emailError) {
                console.error('Error sending password reset email:', emailError);
                // Xử lý lỗi gửi email (nhưng vẫn trả về thành công cho client)
            }
        } else {
            console.log(`Password reset request for non-existent email: ${email}`);
        }

        // Luôn trả về thông báo này để bảo mật
        return NextResponse.json({ message: 'Nếu email của bạn tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.' }, { status: 200 });

    } catch (error) {
        console.error('Forgot Password API error:', error);
        return NextResponse.json({ error: 'Đã xảy ra lỗi phía máy chủ.' }, { status: 500 });
    }
}