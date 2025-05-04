// src/components/auth/RegisterForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Import Link để tạo liên kết Đăng nhập

const RegisterForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: ''
    // Thêm confirmPassword nếu API yêu cầu
    // confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false); // State cho trạng thái loading
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // State cho thông báo thành công

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(''); // Xóa lỗi khi người dùng bắt đầu nhập lại
    setSuccess(''); // Xóa thông báo thành công
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    // --- Thêm validation cơ bản phía client (tùy chọn nhưng nên có) ---
    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      setIsLoading(false);
      return;
    }
    // if (formData.password !== formData.confirmPassword) {
    //     setError('Mật khẩu xác nhận không khớp.');
    //     setIsLoading(false);
    //     return;
    // }
    // --- Kết thúc validation ---

    try {
      const response = await fetch('/api/auth/register', { // Endpoint đăng ký
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password, // Không trim password
          fullName: formData.fullName.trim(),
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Lỗi từ API (ví dụ: username/email đã tồn tại)
        throw new Error(data.error || 'Đăng ký thất bại. Vui lòng thử lại.');
      }

      // Đăng ký thành công
      setSuccess('Đăng ký thành công! Đang chuyển đến trang đăng nhập...');
      // Reset form (tùy chọn)
      // setFormData({ username: '', email: '', password: '', fullName: '' });

      // Chờ một chút để người dùng đọc thông báo rồi chuyển hướng
      setTimeout(() => {
        router.push('/login');
      }, 2000); // Chờ 2 giây

    } catch (err: any) {
      console.error("Registration error:", err);
      // Hiển thị lỗi cụ thể từ API hoặc lỗi chung
      setError(err.message || 'Đã xảy ra lỗi hệ thống khi đăng ký.');
      setIsLoading(false); // Dừng loading khi có lỗi
    }
    // Lưu ý: setIsLoading(false) không cần đặt ở cuối nếu đăng ký thành công và chuyển hướng
  };

  return (
    // Container bao ngoài, căn giữa, nền gradient
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gradient-to-br from-cyan-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Thẻ (Card) chứa form */}
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        {/* Tiêu đề */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Tạo tài khoản mới
          </h2>
        </div>

        {/* Form đăng ký */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Hiển thị lỗi */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          {/* Hiển thị thành công */}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative text-sm" role="alert">
              <span className="block sm:inline">{success}</span>
            </div>
          )}

          {/* Phần nhập liệu */}
          <div className="space-y-4">
            {/* Tên đăng nhập */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Tên đăng nhập <span className="text-red-500">*</span>
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                placeholder="Nhập tên đăng nhập"
                value={formData.username}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            {/* Họ và tên */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                placeholder="Nhập họ tên đầy đủ"
                value={formData.fullName}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            {/* Email */}
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
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            {/* Mật khẩu */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                placeholder="Tối thiểu 6 ký tự"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            {/* Thêm trường Xác nhận mật khẩu nếu cần */}
            {/* <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Xác nhận mật khẩu <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                placeholder="Nhập lại mật khẩu"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div> */}

          </div>

          {/* Nút Đăng ký */}
          <div>
            <button
              type="submit"
              disabled={isLoading || !!success} // Vô hiệu hóa cả khi thành công để chờ chuyển hướng
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${isLoading || success
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
              {isLoading ? 'Đang đăng ký...' : (success ? 'Thành công!' : 'Đăng ký')}
            </button>
          </div>

          {/* Liên kết quay lại Đăng nhập */}
          <div className="text-sm text-center">
            <span className="text-gray-600">Đã có tài khoản? </span>
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Đăng nhập ngay
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;