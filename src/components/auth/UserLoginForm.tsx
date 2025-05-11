// src/components/auth/UserLoginForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'; // Sử dụng icon outline từ Heroicons v2

const UserLoginForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State mới để bật/tắt hiển thị mật khẩu

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('user-credentials', {
        username: formData.username.trim(),
        password: formData.password,
        redirect: false,
      });

      if (!result) {
        throw new Error('Không nhận được phản hồi từ server');
      }

      if (result.error) {
        console.error('SignIn Error:', result.error);
        if (result.error === 'CredentialsSignin') {
          setError('Tên đăng nhập hoặc mật khẩu không chính xác.');
        } else {
          setError(result.error || 'Đăng nhập thất bại. Vui lòng thử lại.');
        }
        setIsLoading(false);
        return;
      }

      if (result.ok) {
        router.replace('/'); // Chuyển về trang chủ
      } else {
        setError('Đăng nhập thất bại, vui lòng thử lại.');
        setIsLoading(false);
      }

    } catch (err: any) {
      console.error('Login submit error:', err);
      setError('Đã xảy ra lỗi hệ thống khi đăng nhập.');
      setIsLoading(false);
    }
  };

  // Hàm toggle hiển thị mật khẩu
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gradient-to-br from-indigo-50 via-white to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
        <div>
          {/* Optional: Thêm logo ở đây */}
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Đăng nhập tài khoản
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="space-y-4 rounded-md shadow-sm">
            {/* Trường Tên đăng nhập (giữ nguyên) */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Tên đăng nhập
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                placeholder="Nhập tên đăng nhập của bạn"
                value={formData.username}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            {/* Trường Mật khẩu - THÊM ICON CON MẮT */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu
              </label>
              <div className="relative"> {/* Container cha có relative */}
                <input
                  id="password"
                  name="password"
                  // Thay đổi type dựa trên state showPassword
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  // Thêm padding bên phải (pr) để không bị icon che - Bỏ focus:z-10
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                  placeholder="Nhập mật khẩu của bạn"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {/* Button chứa icon con mắt */}
                <button
                  type="button" // Quan trọng: đặt type="button" để không submit form
                  onClick={toggleShowPassword} // Gọi hàm toggle khi click
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-800 cursor-pointer focus:outline-none"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} // Hỗ trợ screen reader
                >
                  {showPassword ? (
                    // Icon Mắt có gạch chéo khi mật khẩu hiển thị
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    // Icon Mắt khi mật khẩu ẩn
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Nút Đăng nhập (giữ nguyên) */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${isLoading
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                } transition duration-150 ease-in-out`}
            >
              {isLoading && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
          </div>
        </form>

        {/* Liên kết Quên mật khẩu và Đăng ký (giữ nguyên) */}
        <div className="text-sm text-center space-y-2 mt-4">
          <div>
            <Link href="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
              Quên mật khẩu?
            </Link>
          </div>
          <div>
            <span className="text-gray-600">Chưa có tài khoản? </span>
            <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              Đăng ký ngay
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UserLoginForm;