// src/app/account/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout'; // Đảm bảo đường dẫn layout của bạn đúng

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

  useEffect(() => {
    console.log('>>> [FRONTEND LOG] useEffect triggered. Status:', status);

    if (status === 'authenticated') {
      // Tạo biến tạm để giữ user sau khi kiểm tra null/undefined
      const currentUser = session?.user;

      // Kiểm tra biến tạm currentUser
      if (currentUser) {
        // Bên trong khối này, TypeScript biết currentUser chắc chắn không phải null/undefined
        console.log('>>> [FRONTEND LOG] useEffect updating form with session data:', {
          fullName: currentUser.fullName, // Sử dụng biến tạm
          email: currentUser.email,
          username: currentUser.username
        });
        setForm((prevForm) => ({
          ...prevForm,
          // Sử dụng biến tạm currentUser ở đây - lỗi sẽ biến mất
          fullName: currentUser.fullName || '',
          email: currentUser.email || '',
          username: currentUser.username || '',
        }));
      } else {
        // Xử lý trường hợp currentUser là null/undefined (giữ nguyên)
        console.warn('>>> [FRONTEND LOG] Authenticated, but session.user is null. Possible server error during session fetch.');
        setError("Không thể tải đầy đủ thông tin tài khoản. Vui lòng thử lại.");
        setForm({ fullName: '', email: '', username: '', oldPassword: '', newPassword: '' });
      }
    } else if (status === 'unauthenticated') {
      // Reset form (giữ nguyên)
      console.log('>>> [FRONTEND LOG] useEffect resetting form due to unauthenticated status.');
      setForm({
        fullName: '', email: '', username: '', oldPassword: '', newPassword: ''
      });
      setMessage('');
      setError('');
    }

  }, [session, status]);

  // --- Các hàm xử lý khác (handleChange, handleSubmit) giữ nguyên như trước ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    // --- Các kiểm tra validation giữ nguyên ---
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

    try {
      // Gọi API
      const res = await fetch('/api/user/me/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          ...(form.newPassword && { oldPassword: form.oldPassword }),
          ...(form.newPassword && { newPassword: form.newPassword }),
        }),
      });

      const data = await res.json();
      console.log('>>> [FRONTEND LOG] API Response Data:', data);

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Cập nhật thông tin thất bại.');
      }

      // --- Cập nhật UI ngay lập tức ---
      setMessage('Cập nhật thông tin thành công!');
      console.log('>>> [FRONTEND LOG] Updating form state directly from API response:', { fullName: data.fullName, email: data.email });
      setForm(prev => ({
        ...prev,
        fullName: data.fullName || '', // Dùng || '' phòng trường hợp API trả về null
        email: data.email || '',     // Dùng || '' phòng trường hợp API trả về null
        oldPassword: '',
        newPassword: ''
      }));

      // --- Cập nhật session ---
      console.log('>>> [FRONTEND LOG] Calling update() to refresh session...');
      try {
        await update();
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

  // --- Render Giao Diện ---

  // Hiển thị loading khi đang kiểm tra session ban đầu
  if (status === 'loading') {
    return <Layout><div className="text-center py-10">Đang tải thông tin tài khoản...</div></Layout>;
  }

  // Yêu cầu đăng nhập nếu chưa xác thực
  // Quan trọng: Kiểm tra cả trường hợp status === 'authenticated' nhưng session.user là null (đã xử lý lỗi ở useEffect)
  // Người dùng vẫn thấy form nhưng có thông báo lỗi. Hoặc có thể chuyển hướng về login nếu muốn.
  if (status === 'unauthenticated') {
    return <Layout><div className="text-center py-10 text-red-500">Bạn cần đăng nhập để xem trang này.</div></Layout>;
  }

  // --- Render Form (khi status === 'authenticated') ---
  // Phần JSX của form giữ nguyên như code gốc của bạn, sử dụng state `form`
  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Quản lý tài khoản</h1>
        <form className="space-y-4 bg-white p-6 rounded-lg shadow-md" onSubmit={handleSubmit} noValidate>
          {/* Thông báo lỗi và thành công */}
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm mb-4">{error}</div>}
          {message && <div className="p-3 bg-green-100 text-green-700 rounded-md text-sm mb-4">{message}</div>}

          {/* Tên đăng nhập */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
            <input
              id="username" type="text" name="username"
              value={form.username} // Lấy từ state
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed focus:ring-0 focus:border-gray-300"
              disabled readOnly
            />
            <p className="text-xs text-gray-500 mt-1">Tên đăng nhập không thể thay đổi.</p>
          </div>

          {/* Họ và tên */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
            <input
              id="fullName" type="text" name="fullName"
              value={form.fullName} // Lấy từ state
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required aria-required="true"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="email" type="email" name="email"
              value={form.email} // Lấy từ state
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required aria-required="true"
            />
          </div>

          {/* Đổi mật khẩu */}
          <hr className="my-6 border-t border-gray-200" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Đổi mật khẩu (Tùy chọn)</h2>
          <p className="text-sm text-gray-500 mb-4">Để trống cả hai ô bên dưới nếu bạn không muốn thay đổi mật khẩu.</p>

          {/* Mật khẩu cũ */}
          <div>
            <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu cũ</label>
            <input
              id="oldPassword" type="password" name="oldPassword"
              value={form.oldPassword} // Lấy từ state
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              autoComplete="current-password"
            />
          </div>

          {/* Mật khẩu mới */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
            <input
              id="newPassword" type="password" name="newPassword"
              value={form.newPassword} // Lấy từ state
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              autoComplete="new-password"
              minLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">Nhập ít nhất 6 ký tự nếu bạn muốn đổi mật khẩu.</p>
          </div>

          {/* Nút Submit */}
          <div className="pt-4">
            <button
              type="submit"
              // Vô hiệu hóa nếu đang loading hoặc user không hợp lệ (status !== 'authenticated' HOẶC session.user là null)
              disabled={isLoading || status !== 'authenticated' || !session?.user}
              className={`w-full flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-md font-semibold shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-disabled={isLoading || status !== 'authenticated' || !session?.user}
            >
              {isLoading ? (
                <> {/* Dùng Fragment để nhóm */}
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang lưu...
                </>
              ) : (
                // Khi không loading
                'Lưu thay đổi'
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}