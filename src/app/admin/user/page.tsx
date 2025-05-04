'use client';
import { useState, useEffect, useMemo } from 'react'; // Thêm useMemo
import UserForm from '@/components/admin/UserForm';
import { User } from '@/types/user';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState(''); // State cho từ khóa tìm kiếm

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const data = await response.json();
        const transformedData = data.map((user: User) => ({
          ...user,
          avatar: user.avatar || '/default-avatar.png'
        }));
        setUsers(transformedData);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Lọc người dùng dựa trên searchTerm
  const filteredUsers = useMemo(() => {
    if (!searchTerm) {
      return users; // Trả về toàn bộ nếu không có từ khóa
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return users.filter(user =>
      user.fullName.toLowerCase().includes(lowerCaseSearchTerm) ||
      user.username.toLowerCase().includes(lowerCaseSearchTerm) ||
      user.email.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [users, searchTerm]); // Tính toán lại khi users hoặc searchTerm thay đổi

  const handleAddUser = () => {
    setCurrentUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      try {
        const response = await fetch(`/api/user/${userId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          await fetchUsers(); // Tải lại danh sách sau khi xóa
        }
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleSubmit = async (formData: FormData) => {
    try {
      const url = currentUser
        ? `/api/user/${currentUser._id}`
        : '/api/user';

      const method = 'PUT'; // Giữ nguyên PUT cho cả thêm và sửa

      const submitFormData = new FormData();
      Array.from(formData.entries()).forEach(([key, value]) => {
        if (key === 'file' && value instanceof File && value.size > 0) {
          submitFormData.append('file', value);
        } else if (key === 'isActive') {
          submitFormData.append(key, value === 'true' ? 'true' : 'false');
        } else if (value !== null && value !== undefined) { // Đảm bảo giá trị không phải null/undefined
          submitFormData.append(key, value as string);
        }
      });

      if (currentUser) {
        submitFormData.append('_id', currentUser._id);
        // Chỉ gửi currentAvatar nếu nó tồn tại và không phải là default
        if (currentUser.avatar && !currentUser.avatar.includes('default-avatar')) {
          submitFormData.append('currentAvatar', currentUser.avatar);
        }
      }

      const response = await fetch(url, {
        method,
        body: submitFormData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Không thể lưu thông tin người dùng');
      }

      await fetchUsers(); // Tải lại danh sách sau khi thêm/sửa
      setIsModalOpen(false);
      setCurrentUser(null); // Reset currentUser
      alert(currentUser ? 'Cập nhật thành công!' : 'Thêm người dùng thành công!');

    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Có lỗi xảy ra khi xử lý yêu cầu');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý Người dùng</h1>
        {/* Thêm ô tìm kiếm */}
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Tìm kiếm người dùng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddUser}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Thêm người dùng
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"> {/* Thêm z-index */}
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"> {/* Thêm max-height và overflow */}
            <h2 className="text-xl font-bold mb-4">
              {currentUser ? 'Sửa người dùng' : 'Thêm người dùng mới'}
            </h2>
            <UserForm
              user={currentUser || undefined}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsModalOpen(false);
                setCurrentUser(null);
              }}
            />
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto"> {/* Thêm overflow-x-auto */}
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Người dùng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vai trò
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"> {/* Căn phải cho Thao tác */}
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Sử dụng filteredUsers thay vì users */}
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        className="h-10 w-10 rounded-full object-cover flex-shrink-0" // Thêm flex-shrink-0
                        src={user.avatar || '/default-avatar.png'}
                        alt={user.username}
                        onError={(e) => (e.currentTarget.src = '/default-avatar.png')} // Xử lý lỗi ảnh
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                        <div className="text-sm text-gray-500">{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.isActive ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"> {/* Căn phải nội dung */}
                    <button
                      onClick={() => handleEditUser(user)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4" // Đổi màu và thêm margin
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Không tìm thấy người dùng nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}