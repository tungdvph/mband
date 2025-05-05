// src/components/auth/UserLoginForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link'; // Đảm bảo đã import Link

const UserLoginForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false); // Thêm state loading
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(''); // Xóa lỗi khi người dùng bắt đầu nhập lại
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); // Reset lỗi
    setIsLoading(true); // Bắt đầu loading

    try {
      const result = await signIn('user-credentials', {
        username: formData.username.trim(), // Trim khoảng trắng thừa
        password: formData.password,
        redirect: false, // Quan trọng: tự xử lý redirect sau khi check kết quả
      });

      if (!result) {
        throw new Error('Không nhận được phản hồi từ server');
      }

      if (result.error) {
        console.error('SignIn Error:', result.error);
        // Kiểm tra lỗi cụ thể từ next-auth hoặc API của bạn
        if (result.error === 'CredentialsSignin') {
          setError('Tên đăng nhập hoặc mật khẩu không chính xác.');
        } else {
          // Hiển thị lỗi chung hoặc lỗi cụ thể từ result.error nếu có
          setError(result.error || 'Đăng nhập thất bại. Vui lòng thử lại.');
        }
        setIsLoading(false); // Dừng loading khi có lỗi
        return;
      }

      if (result.ok) {
        // Đăng nhập thành công, chuyển hướng về trang chủ hoặc trang trước đó
        // Bạn có thể dùng result.url nếu đã cấu hình callbackUrl đúng
        router.replace('/'); // Chuyển về trang chủ
        // Không cần setIsLoading(false) vì trang sẽ chuyển hướng
      } else {
        // Trường hợp không mong muốn khác
        setError('Đăng nhập thất bại, vui lòng thử lại.');
        setIsLoading(false);
      }

    } catch (err: any) {
      console.error('Login submit error:', err);
      setError('Đã xảy ra lỗi hệ thống khi đăng nhập.');
      setIsLoading(false); // Dừng loading khi có exception
    }
  };

  return (
    // Container bao ngoài để căn giữa form trên màn hình
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gradient-to-br from-indigo-50 via-white to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Thẻ (Card) chứa form */}
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
        {/* Tiêu đề */}
        <div>
          {/* Optional: Thêm logo ở đây */}
          {/* <img className="mx-auto h-12 w-auto" src="/logo.png" alt="Logo" /> */}
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Đăng nhập tài khoản
          </h2>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Hiển thị lỗi */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {/* Phần nhập liệu */}
          <div className="space-y-4 rounded-md shadow-sm">
            {/* Trường Tên đăng nhập */}
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
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition duration-150 ease-in-out"
                placeholder="Nhập tên đăng nhập của bạn"
                value={formData.username}
                onChange={handleChange}
                disabled={isLoading} // Vô hiệu hóa khi đang gửi
              />
            </div>

            {/* Trường Mật khẩu */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition duration-150 ease-in-out"
                placeholder="Nhập mật khẩu của bạn"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading} // Vô hiệu hóa khi đang gửi
              />
            </div>
          </div>

          {/* Nút Đăng nhập */}
          <div>
            <button
              type="submit"
              disabled={isLoading} // Vô hiệu hóa khi đang gửi
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${isLoading
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                } transition duration-150 ease-in-out`}
            >
              {/* Icon loading */}
              {isLoading && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
          </div>
        </form> {/* Kết thúc form ở đây */}

        {/* ----- PHẦN THÊM MỚI ----- */}
        {/* Liên kết Quên mật khẩu và Đăng ký */}
        <div className="text-sm text-center space-y-2 mt-4"> {/* Thêm khoảng cách trên nếu cần */}
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
        {/* ----- KẾT THÚC PHẦN THÊM MỚI ----- */}

      </div> {/* Kết thúc thẻ (Card) chứa form */}
    </div> // Kết thúc container bao ngoài
  );
};

export default UserLoginForm;