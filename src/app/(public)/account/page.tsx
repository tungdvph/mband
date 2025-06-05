// src/app/account/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout'; // Đảm bảo đường dẫn layout của bạn đúng
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'; // Import icons

export default function AccountPage() {
  const { data: session, status, update } = useSession();

  // State cho form
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    username: '',
    oldPassword: '',
    newPassword: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // State để quản lý việc hiển thị mật khẩu
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    console.log('>>> [FRONTEND LOG] useEffect triggered. Status:', status);

    if (status === 'authenticated') {
      const currentUser = session?.user;
      if (currentUser) {
        console.log('>>> [FRONTEND LOG] useEffect updating form with session data:', {
          fullName: currentUser.fullName,
          email: currentUser.email,
          username: currentUser.username
        });
        setForm((prevForm) => ({
          ...prevForm,
          fullName: currentUser.fullName || '',
          email: currentUser.email || '',
          username: currentUser.username || '',
        }));
      } else {
        console.warn('>>> [FRONTEND LOG] Authenticated, but session.user is null. Possible server error during session fetch.');
        setError("Không thể tải đầy đủ thông tin tài khoản. Vui lòng thử lại.");
        setForm({ fullName: '', email: '', username: '', oldPassword: '', newPassword: '' });
      }
    } else if (status === 'unauthenticated') {
      console.log('>>> [FRONTEND LOG] useEffect resetting form due to unauthenticated status.');
      setForm({
        fullName: '', email: '', username: '', oldPassword: '', newPassword: ''
      });
      setMessage('');
      setError('');
    }
  }, [session, status]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Xóa thông báo lỗi và thành công khi người dùng bắt đầu nhập liệu
    setError('');
    setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    if (form.newPassword && !form.oldPassword) {
      setError('Vui lòng nhập mật khẩu cũ để đặt mật khẩu mới.');
      setIsLoading(false);
      return;
    }
    if (!form.newPassword && form.oldPassword) {
      setError('Vui lòng nhập mật khẩu mới.');
      setIsLoading(false);
      return;
    }
    if (form.newPassword && form.newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      setIsLoading(false);
      return;
    }
    if (form.newPassword && /\s/.test(form.newPassword)) {
      setError('Mật khẩu mới không được chứa khoảng trắng.');
      setIsLoading(false);
      return;
    }
    if (form.oldPassword && /\s/.test(form.oldPassword)) {
      setError('Mật khẩu cũ không được chứa khoảng trắng.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/user/me/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          ...(form.newPassword && form.oldPassword && { oldPassword: form.oldPassword }),
          ...(form.newPassword && form.oldPassword && { newPassword: form.newPassword }),
        }),
      });

      const data = await res.json();
      console.log('>>> [FRONTEND LOG] API Response Data:', data);

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Cập nhật thông tin thất bại.');
      }

      setMessage('Cập nhật thông tin thành công!');
      console.log('>>> [FRONTEND LOG] Updating form state directly from API response:', { fullName: data.fullName, email: data.email });
      setForm(prev => ({
        ...prev,
        fullName: data.fullName || '',
        email: data.email || '',
        oldPassword: '', // Reset mật khẩu cũ sau khi thành công
        newPassword: ''  // Reset mật khẩu mới sau khi thành công
      }));

      console.log('>>> [FRONTEND LOG] Calling update() to refresh session...');
      try {
        await update(); // Cập nhật session để phản ánh thay đổi (nếu có) lên session.user
        console.log('>>> [FRONTEND LOG] update() call finished.');
      } catch (updateError) {
        console.error(">>> [FRONTEND LOG] Error calling update():", updateError);
      }

    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra trong quá trình cập nhật.');
      console.error(">>> [FRONTEND LOG] Error in handleSubmit:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm toggle hiển thị mật khẩu cũ
  const toggleShowOldPassword = () => {
    setShowOldPassword(!showOldPassword);
  };

  // Hàm toggle hiển thị mật khẩu mới
  const toggleShowNewPassword = () => {
    setShowNewPassword(!showNewPassword);
  };

  if (status === 'loading') {
    return <Layout><div className="text-center py-10">Đang tải thông tin tài khoản...</div></Layout>;
  }

  if (status === 'unauthenticated') {
    return <Layout><div className="text-center py-10 text-red-500">Bạn cần đăng nhập để xem trang này.</div></Layout>;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Quản lý tài khoản</h1>
        <form className="space-y-4 bg-white p-6 rounded-lg shadow-md" onSubmit={handleSubmit} noValidate>
          {error && <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm mb-4" role="alert">{error}</div>}
          {message && <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm mb-4" role="alert">{message}</div>}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
            <input
              id="username" type="text" name="username"
              value={form.username}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed focus:ring-0 focus:border-gray-300"
              disabled readOnly
            />
            <p className="text-xs text-gray-500 mt-1">Tên đăng nhập không thể thay đổi.</p>
          </div>

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
            <input
              id="fullName" type="text" name="fullName"
              value={form.fullName}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="email" type="email" name="email"
              value={form.email}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required aria-required="true"
            />
          </div>

          <hr className="my-6 border-t border-gray-200" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Đổi mật khẩu (Tùy chọn)</h2>
          <p className="text-sm text-gray-500 mb-4">Để trống cả hai ô bên dưới nếu bạn không muốn thay đổi mật khẩu.</p>

          {/* Mật khẩu cũ */}
          <div>
            <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu cũ</label>
            <div className="relative">
              <input
                id="oldPassword"
                name="oldPassword"
                type={showOldPassword ? 'text' : 'password'}
                value={form.oldPassword}
                onChange={handleChange}
                className="mt-1 block w-full pr-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={toggleShowOldPassword}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-800 cursor-pointer focus:outline-none"
                aria-label={showOldPassword ? 'Ẩn mật khẩu cũ' : 'Hiện mật khẩu cũ'}
              >
                {showOldPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mật khẩu mới */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
            <div className="relative">
              <input
                id="newPassword"
                name="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={form.newPassword}
                onChange={handleChange}
                className="mt-1 block w-full pr-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                autoComplete="new-password"
                minLength={form.newPassword || form.oldPassword ? 6 : undefined} // Chỉ yêu cầu minLength khi có nhập mật khẩu mới hoặc cũ
              />
              <button
                type="button"
                onClick={toggleShowNewPassword}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-800 cursor-pointer focus:outline-none"
                aria-label={showNewPassword ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
              >
                {showNewPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            {(form.newPassword || form.oldPassword) && ( // Chỉ hiển thị thông báo khi người dùng bắt đầu nhập mật khẩu
              <p className="text-xs text-gray-500 mt-1">Nhập ít nhất 6 ký tự nếu bạn muốn đổi mật khẩu.</p>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading || status !== 'authenticated' || !session?.user}
              className={`w-full flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-md font-semibold shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-disabled={isLoading || status !== 'authenticated' || !session?.user}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang lưu...
                </>
              ) : (
                'Lưu thay đổi'
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}