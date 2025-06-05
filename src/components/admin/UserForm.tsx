'use client';
import { useState } from 'react';
import { User } from '@/types/user';

interface UserFormProps {
  user?: User | null;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
}

export default function UserForm({ user, onSubmit, onCancel }: UserFormProps) {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '/default-avatar.png');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formElement = e.currentTarget; // Lấy tham chiếu đến form element
    const formData = new FormData(formElement);

    // Validate dữ liệu
    const username = formData.get('username');
    const email = formData.get('email');
    const fullName = formData.get('fullName');

    if (!username || !email || !fullName) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (!user && !formData.get('password')) {
      alert('Vui lòng nhập mật khẩu');
      return;
    }

    // Xử lý trường isActive một cách tường minh
    // Lấy trạng thái của checkbox 'isActive' trực tiếp từ DOM element
    // vì FormData không gửi giá trị cho checkbox không được check.
    const isActiveCheckbox = formElement.elements.namedItem('isActive') as HTMLInputElement | null;
    if (isActiveCheckbox) {
      formData.set('isActive', isActiveCheckbox.checked ? 'true' : 'false'); // Gửi 'true' hoặc 'false'
    } else {
      // Fallback nếu không tìm thấy checkbox (không nên xảy ra nếu name đúng)
      // Nếu là tạo user mới và bạn muốn mặc định isActive là false khi không có checkbox (ít khả năng)
      // Hoặc bạn có thể set một giá trị mặc định ở đây nếu cần, ví dụ:
      // if (!user) formData.set('isActive', 'true'); // Mặc định true cho user mới nếu checkbox không render
      // Tuy nhiên, trong trường hợp này, checkbox luôn render.
      // Nếu không tìm thấy, có thể log lỗi hoặc set một giá trị an toàn.
      console.warn("Checkbox 'isActive' không tìm thấy trong form.");
      formData.set('isActive', 'false'); // Mặc định là false nếu không tìm thấy
    }


    try {
      // Nếu có file ảnh mới
      if (avatarFile) {
        formData.set('file', avatarFile);
        // Nếu có file mới, không cần gửi path avatar cũ nữa
        if (formData.has('avatar')) {
          formData.delete('avatar');
        }
      } else if (user?.avatar) {
        // Nếu không có file mới, và user hiện tại có avatar, gửi path avatar cũ
        // Điều này cho phép backend biết giữ lại avatar hiện tại
        formData.set('avatar', user.avatar);
      }
      // Nếu không có avatarFile và user không có avatar (hoặc là default), không cần gửi trường 'avatar' hay 'file'.
      // Backend nên xử lý trường hợp này để đặt avatar mặc định nếu cần.

      onSubmit(formData);
    } catch (error) {
      console.error('Error submitting UserForm:', error);
      alert(error instanceof Error ? error.message : 'Có lỗi xảy ra khi gửi form');
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
    } else {
      // Nếu người dùng hủy chọn file (ví dụ, chọn rồi lại xóa), reset về trạng thái ban đầu
      setAvatarFile(null);
      setAvatarPreview(user?.avatar || '/default-avatar.png');
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
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/default-avatar.png'; }}
          />
          <div>
            <label htmlFor="avatar-upload" className="block text-sm font-medium text-gray-700">Ảnh đại diện</label>
            <input
              id="avatar-upload" // Thêm ID cho label
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
          <label htmlFor="username-input" className="block text-sm font-medium text-gray-700">Tên đăng nhập</label>
          <input
            id="username-input"
            type="text"
            name="username"
            defaultValue={user?.username || ''} // Thêm || '' để tránh uncontrolled input nếu user.username là undefined
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label htmlFor="email-input" className="block text-sm font-medium text-gray-700">Email</label>
          <input
            id="email-input"
            type="email"
            name="email"
            defaultValue={user?.email || ''}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label htmlFor="password-input" className="block text-sm font-medium text-gray-700">Mật khẩu</label>
          <input
            id="password-input"
            type="password"
            name="password"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required={!user} // Required only for new users
            minLength={user ? undefined : 6} // minLength chỉ áp dụng cho user mới, không áp dụng khi sửa (trừ khi có nhập)
            placeholder={user ? "Để trống nếu không đổi" : ""}
          />
          {user && (
            <p className="mt-1 text-xs text-gray-500">Để trống nếu bạn không muốn thay đổi mật khẩu.</p>
          )}
          {!user && (
            <p className="mt-1 text-xs text-gray-500">
              Mật khẩu phải có ít nhất 6 ký tự.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="fullName-input" className="block text-sm font-medium text-gray-700">Họ và tên</label>
          <input
            id="fullName-input"
            type="text"
            name="fullName"
            defaultValue={user?.fullName || ''}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label htmlFor="role-select" className="block text-sm font-medium text-gray-700">Vai trò</label>
          <select
            id="role-select"
            name="role"
            defaultValue={user?.role || 'user'}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="user">Người dùng</option>
            <option value="admin">Quản trị viên</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            id="isActive-checkbox" // Thêm ID cho label
            type="checkbox"
            name="isActive" // name này quan trọng để formElement.elements.namedItem có thể tìm thấy
            defaultChecked={user?.isActive ?? true}
            // value="true" // Khi dùng JS để lấy .checked, value này không còn là yếu tố quyết định chính nữa
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isActive-checkbox" className="ml-2 block text-sm text-gray-900">Hoạt động</label>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm font-medium"
          >
            {user ? 'Cập nhật' : 'Thêm'}
          </button>
        </div>
      </div>
    </form>
  );
}