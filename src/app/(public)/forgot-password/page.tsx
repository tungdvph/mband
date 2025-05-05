// src/app/(public)/forgot-password/page.tsx
import Layout from '@/components/layout/Layout';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'; // Component bạn cần tạo

export default function ForgotPasswordPage() {
    return (
        <Layout>
            <ForgotPasswordForm />
        </Layout>
    );
}