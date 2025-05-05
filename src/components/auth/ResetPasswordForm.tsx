'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Nhận token làm prop
interface ResetPasswordFormProps {
    token: string;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ token }) => {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!password || !confirmPassword) {
            setError('Vui lòng nhập đầy đủ mật khẩu mới và xác nhận mật khẩu.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

        if (password.length < 6) {
            setError('Mật khẩu phải từ 6 ký tự trở lên.');
            return;
        }
        if (/\s/.test(password)) {
            setError('Mật khẩu không được chứa khoảng trắng.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }), // Gửi token và mật khẩu mới
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Đặt lại mật khẩu thất bại. Token có thể đã hết hạn hoặc không hợp lệ.');
            } else {
                setSuccess('Đặt lại mật khẩu thành công! Đang chuyển đến trang đăng nhập...');
                setPassword('');
                setConfirmPassword('');
                // Chuyển hướng sau vài giây
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            }
        } catch (err) {
            console.error("Reset Password error:", err);
            setError('Lỗi kết nối hoặc lỗi hệ thống khi đặt lại mật khẩu.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gradient-to-br from-teal-50 via-white to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                        Đặt Lại Mật Khẩu
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Nhập mật khẩu mới cho tài khoản của bạn.
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm" role="alert">{error}</div>}
                    {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative text-sm" role="alert">{success}</div>}

                    <div className="space-y-4">
                        {/* Mật khẩu mới */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Mật khẩu mới <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                disabled={isLoading || !!success}
                            />
                        </div>
                        {/* Xác nhận mật khẩu */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                                placeholder="Nhập lại mật khẩu mới"
                                value={confirmPassword}
                                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                                disabled={isLoading || !!success}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading || !!success}
                            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${isLoading || success ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'} transition duration-150 ease-in-out`}
                        >
                            {/* Icon loading */}
                            {isLoading ? 'Đang cập nhật...' : (success ? 'Đã cập nhật!' : 'Đặt lại mật khẩu')}
                        </button>
                    </div>
                    {!success && ( // Chỉ hiển thị link quay lại nếu chưa thành công
                        <div className="text-sm text-center">
                            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                                Quay lại Đăng nhập
                            </Link>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordForm;