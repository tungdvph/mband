// src/lib/utils/email.ts
import nodemailer from 'nodemailer';

// Hàm gửi email đặt lại mật khẩu
export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
    // --- Cấu hình Nodemailer Transporter ---
    // Sử dụng biến môi trường để bảo mật thông tin nhạy cảm.
    // Ví dụ cấu hình này dùng cho một SMTP server chung.
    // Bạn cần thay đổi dựa trên nhà cung cấp dịch vụ email của bạn (Gmail, SendGrid, Mailgun, AWS SES, etc.)
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVER_HOST, // ví dụ: 'smtp.gmail.com' hoặc 'smtp.sendgrid.net'
        port: parseInt(process.env.EMAIL_SERVER_PORT || '587', 10), // ví dụ: 587 (TLS) hoặc 465 (SSL)
        // `secure: true` nếu dùng port 465, ngược lại thường là false (vì sẽ dùng STARTTLS)
        secure: parseInt(process.env.EMAIL_SERVER_PORT || '587', 10) === 465,
        auth: {
            // Thông tin xác thực lấy từ biến môi trường
            user: process.env.EMAIL_USERNAME, // Email hoặc username của bạn
            pass: process.env.EMAIL_PASSWORD, // Mật khẩu email, App Password (Gmail), hoặc API Key (SendGrid)
        },
        // Có thể cần thêm các tùy chọn TLS/SSL tùy nhà cung cấp
        // tls: {
        //   ciphers:'SSLv3' // Ví dụ nếu cần
        //   rejectUnauthorized: false // Chỉ dùng khi test với self-signed certificates (KHÔNG NÊN DÙNG TRONG PRODUCTION)
        // }
    });

    // --- Định nghĩa nội dung Email ---
    // Lấy địa chỉ "From" từ biến môi trường, nếu không có thì dùng EMAIL_USERNAME
    const fromAddress = `"Cyber Band" <${process.env.EMAIL_FROM || process.env.EMAIL_USERNAME}>`;

    const mailOptions = {
        from: fromAddress, // Địa chỉ người gửi (hiển thị trong email client)
        to: to, // Địa chỉ người nhận (email của user)
        subject: 'Yêu cầu đặt lại mật khẩu cho tài khoản của bạn', // Chủ đề email
        text: `Chào ${name || 'bạn'},\n\nBạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại [Cyber Band].\nVui lòng nhấn vào liên kết sau hoặc dán vào trình duyệt để hoàn tất quá trình (liên kết này sẽ hết hạn sau 1 giờ):\n\n${resetUrl}\n\nNếu bạn không yêu cầu điều này, vui lòng bỏ qua email này và mật khẩu của bạn sẽ không thay đổi.\n\nTrân trọng,\nĐội ngũ [Cyber Band]`, // Nội dung dạng text thuần
        html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #333;">Yêu cầu Đặt Lại Mật Khẩu</h2>
        <p>Chào ${name || 'bạn'},</p>
        <p>Bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại <strong>[Cyber Band]</strong>.</p>
        <p>Vui lòng nhấn vào nút bên dưới để tạo mật khẩu mới. Liên kết này sẽ hết hạn sau <strong>1 giờ</strong>.</p>
        <p style="text-align: center; margin: 25px 0;">
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 25px; font-size: 16px; color: #ffffff; background-color: #007bff; text-decoration: none; border-radius: 5px;">
            Đặt Lại Mật Khẩu
          </a>
        </p>
        <p>Nếu nút trên không hoạt động, bạn cũng có thể sao chép và dán URL sau vào thanh địa chỉ của trình duyệt:</p>
        <p><a href="${resetUrl}" style="word-break: break-all;">${resetUrl}</a></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p>Nếu bạn không thực hiện yêu cầu này, bạn có thể bỏ qua email này một cách an toàn. Mật khẩu của bạn sẽ không bị thay đổi.</p>
        <p>Trân trọng,</p>
        <p>Đội ngũ <strong>[Cyber Band]</strong></p>
      </div>
    `, // Nội dung dạng HTML (thân thiện hơn)
    };

    // --- Gửi Email ---
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent successfully to ${to}: ${info.messageId}`);
        // Bạn có thể trả về info nếu cần dùng ở nơi gọi hàm
        return info;
    } catch (error) {
        console.error(`Error sending password reset email to ${to}:`, error);
        // Ném lỗi để API route (nơi gọi hàm này) có thể biết và xử lý
        // (Mặc dù API route có thể vẫn trả về thông báo chung chung cho client vì lý do bảo mật)
        throw new Error('Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.');
    }
}

// Bạn có thể thêm các hàm gửi email khác ở đây nếu cần
// Ví dụ: Gửi email xác thực tài khoản, thông báo, v.v.
// export async function sendVerificationEmail(to: string, name: string, verificationUrl: string) { ... }