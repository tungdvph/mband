// /app/admin/user/page.tsx
'use client';
import { useState, useEffect, useMemo } from 'react'; // Đã thêm useMemo
import UserForm from '@/components/admin/UserForm';
import { User } from '@/types/user'; // Đảm bảo type User được import đúng

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState(''); // State cho từ khóa tìm kiếm

  // --- Fetch Data ---
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/user'); // Endpoint API của bạn
      if (response.ok) {
        const data = await response.json();
        // Thêm ảnh đại diện mặc định nếu user không có avatar
        const transformedData = data.map((user: User) => ({
          ...user,
          avatar: user.avatar || '/default-avatar.png' // Đường dẫn tới ảnh mặc định
        }));
        setUsers(transformedData);
      } else {
        console.error('Failed to fetch users:', response.statusText);
        setUsers([]); // Set thành mảng rỗng nếu lỗi
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]); // Set thành mảng rỗng nếu lỗi mạng
    }
  };

  // Fetch users khi component mount lần đầu
  useEffect(() => {
    fetchUsers();
  }, []);

  // --- Filtering Logic ---
  // Lọc người dùng dựa trên searchTerm bằng useMemo để tối ưu
  const filteredUsers = useMemo(() => {
    if (!searchTerm) {
      return users; // Trả về toàn bộ nếu không có từ khóa
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    // Tìm kiếm trong fullName, username, email
    return users.filter(user =>
      (user.fullName?.toLowerCase() || '').includes(lowerCaseSearchTerm) || // Thêm ?. và || '' để tránh lỗi nếu null/undefined
      (user.username?.toLowerCase() || '').includes(lowerCaseSearchTerm) || // Thêm ?. và || ''
      (user.email?.toLowerCase() || '').includes(lowerCaseSearchTerm)      // Thêm ?. và || ''
    );
  }, [users, searchTerm]); // Tính toán lại khi users hoặc searchTerm thay đổi

  // --- Handlers ---
  const handleAddUser = () => {
    setCurrentUser(null); // Đảm bảo không có user nào được chọn khi thêm mới
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setCurrentUser(user); // Set user hiện tại để form có dữ liệu
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.')) {
      try {
        const response = await fetch(`/api/user/${userId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          // Cập nhật state trực tiếp để UI phản hồi nhanh hơn
          setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
          alert('Xóa người dùng thành công!');
        } else {
          const errorData = await response.json().catch(() => ({})); // Cố gắng parse lỗi
          throw new Error(errorData.error || 'Không thể xóa người dùng');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert(error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa');
      }
    }
  };

  // Xử lý submit form (Thêm mới hoặc Cập nhật)
  const handleSubmit = async (formData: FormData) => {
    try {
      const url = currentUser
        ? `/api/user/${currentUser._id}` // URL cập nhật nếu có currentUser
        : '/api/user';                  // URL tạo mới nếu không

      // API user hiện tại dùng PUT cho cả tạo mới và cập nhật
      // Nếu API của bạn dùng POST cho tạo mới, cần điều chỉnh method ở đây
      const method = 'PUT';

      // Xử lý FormData: Chỉ gửi những gì cần thiết và đúng định dạng
      const submitFormData = new FormData();
      let hasFile = false; // Biến kiểm tra có file avatar mới không
      Array.from(formData.entries()).forEach(([key, value]) => {
        if (key === 'file' && value instanceof File && value.size > 0) {
          submitFormData.append('file', value); // Thêm file avatar mới
          hasFile = true;
        } else if (key === 'isActive') {
          // Đảm bảo giá trị boolean được gửi đúng dạng chuỗi 'true'/'false'
          submitFormData.append(key, String(value === 'true'));
        } else if (key === 'password' && value === '') {
          // Không gửi trường password nếu nó rỗng (nghĩa là không muốn đổi pass)
        } else if (value !== null && value !== undefined && value !== '') {
          // Chỉ gửi các trường có giá trị (không rỗng, null, undefined)
          submitFormData.append(key, value as string);
        }
      });

      // Nếu là cập nhật (có currentUser)
      if (currentUser) {
        submitFormData.append('_id', currentUser._id); // Gửi ID để backend biết cập nhật user nào
        // Chỉ gửi 'currentAvatar' nếu không có file mới được upload
        // và avatar hiện tại không phải là ảnh mặc định.
        // Backend sẽ dùng thông tin này để quyết định có xóa ảnh cũ không nếu không có file mới.
        if (!hasFile && currentUser.avatar && !currentUser.avatar.includes('default-avatar')) {
          submitFormData.append('currentAvatar', currentUser.avatar);
        }
      }
      // Nếu đang tạo mới và không upload file, không cần gửi gì liên quan đến avatar.
      // Nếu đang sửa và không upload file mới, nhưng muốn xóa avatar? API cần cơ chế riêng cho việc này (ví dụ: gửi ?removeAvatar=true)


      // Gửi request lên API
      const response = await fetch(url, {
        method,
        body: submitFormData // Gửi FormData
      });

      const result = await response.json(); // Luôn cố gắng parse JSON response

      if (!response.ok) {
        // Ném lỗi với thông điệp từ server hoặc thông điệp mặc định
        throw new Error(result.error || 'Không thể lưu thông tin người dùng');
      }

      // Thành công: đóng modal, fetch lại dữ liệu, reset state, báo thành công
      await fetchUsers();
      setIsModalOpen(false);
      setCurrentUser(null);
      alert(currentUser ? 'Cập nhật thành công!' : 'Thêm người dùng thành công!');

    } catch (error) {
      // Xử lý lỗi: log lỗi và báo cho người dùng
      console.error('Error submitting user form:', error);
      alert(error instanceof Error ? error.message : 'Có lỗi xảy ra khi xử lý yêu cầu');
    }
  };

  // --- JSX ---
  return (
    <div className="p-6"> {/* Thêm padding bao ngoài cho toàn trang */}
      {/* Header: Tiêu đề, Ô tìm kiếm, Nút thêm */}
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Quản lý tài khoản</h1>
        {/* Nhóm Tìm kiếm và Nút thêm */}
        <div className="flex items-center space-x-4">
          {/* Search Input - Style giống News */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {/* Icon kính lúp */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {/* Input field */}
            <input
              type="text"
              placeholder="Tìm theo tên, username, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              // Các class Tailwind giống input trang News
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          {/* Add Button - Style giống News */}
          <button
            onClick={handleAddUser}
            // Các class Tailwind giống button trang News
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 whitespace-nowrap text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Thêm tài khoản
          </button>
        </div>
      </div>

      {/* Add/Edit Modal - Style nhất quán với các trang khác */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"> {/* Giới hạn chiều cao, cho phép scroll */}
            {/* Modal Header - Dính ở trên khi scroll */}
            <div className="sticky top-0 bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {currentUser ? 'Sửa người dùng' : 'Thêm người dùng mới'}
                </h2>
                {/* Nút đóng modal */}
                <button
                  onClick={() => { setIsModalOpen(false); setCurrentUser(null); }} // Đóng modal và reset currentUser
                  className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                  </svg>
                </button>
              </div>
            </div>
            {/* Modal Body - Nội dung form */}
            <div className="px-4 pb-4 pt-2 sm:p-6 sm:pt-2">
              <UserForm
                user={currentUser || undefined} // Truyền undefined nếu currentUser là null
                onSubmit={handleSubmit}
                onCancel={() => {
                  setIsModalOpen(false);
                  setCurrentUser(null); // Reset khi hủy
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bảng hiển thị danh sách người dùng */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {/* Table Head */}
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người dùng</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          {/* Table Body */}
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Kiểm tra và render danh sách hoặc thông báo */}
            {filteredUsers.length > 0 ? (
              // Render các hàng dữ liệu nếu có kết quả lọc
              filteredUsers.map((user) => (
                <tr key={user._id}>
                  {/* Cột Người dùng (Avatar, Tên, Username) */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={user.avatar || '/default-avatar.png'}
                          alt={user.username || user.fullName || 'Avatar'}
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/default-avatar.png'; }} // Xử lý lỗi ảnh tốt hơn
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.fullName || '(Chưa có tên)'}</div>
                        <div className="text-sm text-gray-500">{user.username}</div>
                      </div>
                    </div>
                  </td>
                  {/* Cột Email */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  {/* Cột Vai trò */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                    </span>
                  </td>
                  {/* Cột Trạng thái */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.isActive ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  </td>
                  {/* Cột Thao tác (Sửa, Xóa) */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                      aria-label={`Sửa người dùng ${user.username}`}
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      className="text-red-600 hover:text-red-900"
                      aria-label={`Xóa người dùng ${user.username}`}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              // Render thông báo nếu không có kết quả
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  {searchTerm ? 'Không tìm thấy người dùng nào phù hợp.' : 'Chưa có người dùng nào.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}