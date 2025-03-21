'use client';
import { useState } from 'react';
import { User } from '@/types/user';

interface UserFormProps {
  user?: User | null;  // Change this line to accept null
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
}

export default function UserForm({ user, onSubmit, onCancel }: UserFormProps) {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '/default-avatar.png');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (!user && !formData.get('password')) {
      alert('Vui lòng nhập mật khẩu');
      return;
    }

    try {
      // Upload avatar first if exists
      if (avatarFile) {
        const uploadData = new FormData();
        uploadData.append('file', avatarFile);
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadData
        });

        if (!uploadRes.ok) {
          throw new Error('Không thể tải ảnh lên');
        }

        const { url } = await uploadRes.json();
        // Xóa file cũ nếu có
        formData.delete('file');
        // Thêm URL avatar mới
        formData.set('avatar', url);
      } else if (user?.avatar) {
        // Giữ lại avatar cũ nếu không upload ảnh mới
        formData.set('avatar', user.avatar);
      }

      onSubmit(formData);
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div className="flex items-center space-x-4 mb-4">
          <img 
            src={avatarPreview} 
            alt="Avatar preview" 
            className="w-20 h-20 rounded-full object-cover"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700">Ảnh đại diện</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tên đăng nhập</label>
          <input
            type="text"
            name="username"
            defaultValue={user?.username}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            name="email"
            defaultValue={user?.email}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
          <input
            type="password"
            name="password"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required={!user} // Required only for new users
            minLength={6}
          />
          {!user && (
            <p className="mt-1 text-sm text-gray-500">
              Mật khẩu phải có ít nhất 6 ký tự
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
          <input
            type="text"
            name="fullName"
            defaultValue={user?.fullName}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Vai trò</label>
          <select
            name="role"
            defaultValue={user?.role || 'user'}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="user">Người dùng</option>
            <option value="admin">Quản trị viên</option>
          </select>
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={user?.isActive ?? true}
              className="rounded border-gray-300 text-blue-600"
            />
            <span className="ml-2">Hoạt động</span>
          </label>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {user ? 'Cập nhật' : 'Thêm'}
          </button>
        </div>
      </div>
    </form>
  );
}