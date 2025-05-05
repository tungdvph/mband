// src/components/auth/RegisterForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const RegisterForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(''); // Xóa lỗi khi người dùng bắt đầu nhập lại
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
    // Ngoại trừ password, không trim() password
    const trimmedUsername = formData.username.trim();
    const trimmedEmail = formData.email.trim();
    const password = formData.password; // Không trim password ở đây
    const trimmedFullName = formData.fullName.trim();

    // --- Validation phía Client ---

    // 1. Kiểm tra Tên đăng nhập có khoảng trắng bên trong không
    // Regex \s kiểm tra bất kỳ ký tự khoảng trắng nào
    if (/\s/.test(trimmedUsername)) {
      setError('Tên đăng nhập không được chứa khoảng trắng.');
      setIsLoading(false);
      return;
    }
    // Kiểm tra Tên đăng nhập có rỗng không sau khi trim
    if (!trimmedUsername) {
      setError('Vui lòng nhập tên đăng nhập.');
      setIsLoading(false);
      return;
    }

    // 2. Kiểm tra Họ và tên có rỗng không sau khi trim
    if (!trimmedFullName) {
      setError('Vui lòng nhập họ và tên.');
      setIsLoading(false);
      return;
    }

    // 3. Kiểm tra Email có rỗng không sau khi trim
    if (!trimmedEmail) {
      setError('Vui lòng nhập địa chỉ email.');
      setIsLoading(false);
      return;
    }
    // Kiểm tra định dạng email cơ bản (có thể dùng regex phức tạp hơn)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Định dạng email không hợp lệ.');
      setIsLoading(false);
      return;
    }

    // 4. Kiểm tra độ dài mật khẩu
    if (password.length < 6) {
      setError('Mật khẩu phải từ 6 ký tự trở lên.');
      setIsLoading(false);
      return;
    }

    // 5. Kiểm tra mật khẩu có khoảng trắng bên trong không
    if (/\s/.test(password)) {
      setError('Mật khẩu không được chứa khoảng trắng.');
      setIsLoading(false);
      return;
    }

    // --- Kết thúc validation Client ---

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: trimmedUsername, // Gửi giá trị đã trim
          email: trimmedEmail,       // Gửi giá trị đã trim
          password: password,         // Gửi mật khẩu gốc (server sẽ xử lý)
          fullName: trimmedFullName, // Gửi giá trị đã trim
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Xử lý lỗi cụ thể từ API dựa vào message trả về
        if (data.error === 'Email đã được sử dụng') {
          setError('Địa chỉ Email này đã được đăng ký. Vui lòng sử dụng email khác.');
        } else if (data.error === 'Tên đăng nhập đã được sử dụng') {
          setError('Tên đăng nhập này đã tồn tại. Vui lòng chọn tên khác.');
        } else {
          // Các lỗi khác từ API hoặc lỗi chung
          setError(data.error || 'Đăng ký thất bại. Vui lòng thử lại.');
        }
        setIsLoading(false); // Dừng loading khi có lỗi
        return; // Quan trọng: dừng thực thi sau khi xử lý lỗi
      }

      // Đăng ký thành công
      setSuccess('Đăng ký thành công! Đang chuyển đến trang đăng nhập...');
      // Reset form (tùy chọn)
      setFormData({ username: '', email: '', password: '', fullName: '' });

      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (err: any) {
      console.error("Registration error:", err);
      // Lỗi mạng hoặc lỗi không xác định khác
      setError('Đã xảy ra lỗi kết nối hoặc lỗi hệ thống khi đăng ký.');
      setIsLoading(false);
    }
    // Không cần setIsLoading(false) ở cuối nếu thành công và chuyển hướng
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
                placeholder="Viết liền, không dấu, không khoảng trắng"
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
                placeholder="Từ 6 ký tự trở lên, không chứa khoảng trắng"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
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