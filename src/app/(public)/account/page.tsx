'use client';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import Layout from '@/components/layout/Layout';

export default function AccountPage() {
  const { data: session, status, update } = useSession();
  const [form, setForm] = useState({
    fullName: session?.user?.fullName || '',
    email: session?.user?.email || '',
    username: session?.user?.username || ''
  });
  const [message, setMessage] = useState('');

  if (status === 'loading') {
    return <Layout><div className="text-center py-10">Đang tải thông tin tài khoản...</div></Layout>;
  }

  if (!session?.user) {
    return <Layout><div className="text-center py-10 text-red-500">Bạn cần đăng nhập để xem thông tin tài khoản.</div></Layout>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch('/api/user/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Cập nhật thất bại');
      setMessage('Cập nhật thành công!');
      update(); // Cập nhật lại session nếu cần
    } catch {
      setMessage('Có lỗi xảy ra khi cập nhật.');
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-lg">
        <h1 className="text-2xl font-bold mb-6">Quản lý tài khoản</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tên đăng nhập</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Lưu thay đổi
          </button>
          {message && <div className="text-green-600 mt-2">{message}</div>}
        </form>
      </div>
    </Layout>
  );
}