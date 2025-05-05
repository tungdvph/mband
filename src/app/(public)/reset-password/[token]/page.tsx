// src/app/(public)/reset-password/[token]/page.tsx
import Layout from '@/components/layout/Layout';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm'; // Component bạn cần tạo

// Metadata (tùy chọn)
export const metadata = {
    title: 'Đặt lại mật khẩu',
};

// Params chứa giá trị từ URL, ví dụ { token: 'your-reset-token' }
export default function ResetPasswordPage({ params }: { params: { token: string } }) {
    const { token } = params;

    if (!token) {
        // Xử lý trường hợp không có token (ví dụ: redirect hoặc hiển thị lỗi)
        return (
            <Layout>
                <div className="text-center py-10 text-red-600">Token không hợp lệ hoặc bị thiếu.</div>
            </Layout>
        )
    }

    return (
        <Layout>
            {/* Truyền token xuống component form */}
            <ResetPasswordForm token={token} />
        </Layout>
    );
}