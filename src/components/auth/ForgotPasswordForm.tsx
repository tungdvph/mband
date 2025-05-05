'use client';
import { useState } from 'react';
import Link from 'next/link';

const ForgotPasswordForm = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        if (!email.trim()) {
            setError('Vui lòng nhập địa chỉ email.');
            setIsLoading(false);
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setError('Định dạng email không hợp lệ.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Đã xảy ra lỗi. Vui lòng thử lại.');
            } else {
                setSuccess(data.message || 'Yêu cầu đã được gửi. Vui lòng kiểm tra email.');
                setEmail(''); // Xóa email sau khi gửi thành công
            }
        } catch (err) {
            console.error("Forgot Password error:", err);
            setError('Lỗi kết nối hoặc lỗi hệ thống.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                        Quên Mật Khẩu
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Nhập email của bạn để nhận liên kết đặt lại mật khẩu.
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm" role="alert">{error}</div>}
                    {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative text-sm" role="alert">{success}</div>}

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Địa chỉ Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                                placeholder="example@email.com"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setError(''); setSuccess(''); }}
                                disabled={isLoading || !!success} // Disable nếu đang load hoặc đã thành công
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
                            {isLoading ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
                        </button>
                    </div>
                    <div className="text-sm text-center">
                        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                            Quay lại Đăng nhập
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPasswordForm;