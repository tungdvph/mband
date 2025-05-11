// src/components/auth/RegisterForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const RegisterForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '', // THÊM state cho ô nhập lại mật khẩu
    fullName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // THÊM states để bật/tắt hiển thị mật khẩu
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(''); // Xóa lỗi khi người dùng bắt đầu nhập lại (bao gồm cả lỗi xác nhận mật khẩu)
    setSuccess('');
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    // Lấy giá trị và trim() trước khi validation và gửi đi
    // Ngoại trừ password và confirmPassword, không trim() trực tiếp ở đây
    const trimmedUsername = formData.username.trim();
    const trimmedEmail = formData.email.trim();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword; // Lấy giá trị nhập lại mật khẩu
    const trimmedFullName = formData.fullName.trim();

    // --- Validation phía Client ---

    // 1. Kiểm tra Tên đăng nhập
    if (/\s/.test(trimmedUsername)) {
      setError('Tên đăng nhập không được chứa khoảng trắng.');
      setIsLoading(false);
      return;
    }
    if (!trimmedUsername) {
      setError('Vui lòng nhập tên đăng nhập.');
      setIsLoading(false);
      return;
    }

    // 2. Kiểm tra Họ và tên
    if (!trimmedFullName) {
      setError('Vui lòng nhập họ và tên.');
      setIsLoading(false);
      return;
    }

    // 3. Kiểm tra Email
    if (!trimmedEmail) {
      setError('Vui lòng nhập địa chỉ email.');
      setIsLoading(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Định dạng email không hợp lệ.');
      setIsLoading(false);
      return;
    }

    // 4. Kiểm tra Mật khẩu
    if (password.length < 6) {
      setError('Mật khẩu phải từ 6 ký tự trở lên.');
      setIsLoading(false);
      return;
    }
    if (/\s/.test(password)) {
      setError('Mật khẩu không được chứa khoảng trắng.');
      setIsLoading(false);
      return;
    }

    // 5. Kiểm tra Nhập lại mật khẩu có khớp không
    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.');
      setIsLoading(false);
      return;
    }

    // --- Kết thúc validation Client ---

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: trimmedUsername,
          email: trimmedEmail,
          password: password, // Gửi mật khẩu gốc
          fullName: trimmedFullName,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'Email đã được sử dụng') {
          setError('Địa chỉ Email này đã được đăng ký. Vui lòng sử dụng email khác.');
        } else if (data.error === 'Tên đăng nhập đã được sử dụng') {
          setError('Tên đăng nhập này đã tồn tại. Vui lòng chọn tên khác.');
        } else {
          setError(data.error || 'Đăng ký thất bại. Vui lòng thử lại.');
        }
        setIsLoading(false);
        return;
      }

      setSuccess('Đăng ký thành công! Đang chuyển đến trang đăng nhập...');
      // Reset form (tùy chọn)
      setFormData({ username: '', email: '', password: '', confirmPassword: '', fullName: '' }); // Reset cả confirmPassword

      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (err: any) {
      console.error("Registration error:", err);
      setError('Đã xảy ra lỗi kết nối hoặc lỗi hệ thống khi đăng ký.');
      setIsLoading(false);
    }
  };

  // Hàm toggle hiển thị mật khẩu chính
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  // Hàm toggle hiển thị mật khẩu nhập lại
  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };


  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gradient-to-br from-cyan-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Tạo tài khoản mới
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative text-sm" role="alert">
              <span className="block sm:inline">{success}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Tên đăng nhập (giữ nguyên) */}
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
                placeholder="Viết liền, không dấu, không khoảng trắng"
                value={formData.username}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            {/* Họ và tên (giữ nguyên) */}
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

            {/* Email (giữ nguyên) */}
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

            {/* Mật khẩu - THÊM ICON CON MẮT */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative"> {/* Container cha có relative */}
                <input
                  id="password"
                  name="password"
                  // Thay đổi type dựa trên state showPassword
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  // Thêm padding bên phải (pr) để không bị icon che
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                  placeholder="Từ 6 ký tự trở lên, không chứa khoảng trắng"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {/* Button chứa icon con mắt */}
                <button
                  type="button" // Quan trọng: đặt type="button" để không submit form
                  onClick={toggleShowPassword} // Gọi hàm toggle state khi click
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

            {/* Nhập lại mật khẩu - THÊM MỚI */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Nhập lại mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative"> {/* Container cha có relative */}
                <input
                  id="confirmPassword"
                  name="confirmPassword" // Tên phải khớp với key trong state formData
                  // Thay đổi type dựa trên state showConfirmPassword
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password" // Dùng new-password cho cả 2 trường password mới
                  required
                  // Thêm padding bên phải (pr) để không bị icon che
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                  placeholder="Nhập lại mật khẩu vừa tạo"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {/* Button chứa icon con mắt */}
                <button
                  type="button" // Quan trọng: đặt type="button" để không submit form
                  onClick={toggleShowConfirmPassword} // Gọi hàm toggle state khi click
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-800 cursor-pointer focus:outline-none"
                  aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} // Hỗ trợ screen reader
                >
                  {showConfirmPassword ? (
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

          {/* Nút Đăng ký */}
          <div>
            <button
              type="submit"
              disabled={isLoading || !!success}
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
              {isLoading ? 'Đang xử lý...' : (success ? 'Thành công!' : 'Đăng ký')}
            </button>
          </div>

          {/* Liên kết quay lại Đăng nhập (giữ nguyên) */}
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