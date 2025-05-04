'use client';
import { useState, useEffect, useMemo } from 'react'; // Thêm useMemo
import { Member } from '@/types/member';
import MemberForm from '@/components/admin/MemberForm';

export default function MemberPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchTerm, setSearchTerm] = useState(''); // State cho từ khóa tìm kiếm

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/member');
      if (response.ok) {
        const data = await response.json();
        // Đảm bảo image luôn có giá trị hoặc dùng ảnh mặc định
        const transformedData = data.map((member: Member) => ({
          ...member,
          image: member.image || '/default-member.png'
        }));
        setMembers(transformedData);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Lọc thành viên dựa trên searchTerm
  const filteredMembers = useMemo(() => {
    if (!searchTerm) {
      return members; // Trả về toàn bộ nếu không có từ khóa
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return members.filter(member =>
      member.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      member.role.toLowerCase().includes(lowerCaseSearchTerm)
      // Có thể thêm tìm kiếm theo description nếu cần:
      // || (member.description && member.description.toLowerCase().includes(lowerCaseSearchTerm))
    );
  }, [members, searchTerm]); // Tính toán lại khi members hoặc searchTerm thay đổi

  const handleSubmit = async (formData: FormData) => {
    // Reset lỗi trước khi submit
    // setSubmitError(null); // Nếu bạn có state lưu lỗi

    try {
      const method = selectedMember ? 'PUT' : 'POST';
      const url = selectedMember
        ? `/api/member/${selectedMember._id}`
        : '/api/member';

      // Nếu là PUT và có selectedMember, thêm ID vào formData
      if (method === 'PUT' && selectedMember) {
        // FormData không có phương thức set, nên cần tạo mới hoặc đảm bảo ID đã có
        // Cách đơn giản là API PUT tự lấy ID từ URL
        // Hoặc nếu API cần ID trong body: formData.append('_id', selectedMember._id.toString());
        // Thêm currentImage để xử lý ở backend nếu cần giữ ảnh cũ khi không upload ảnh mới
        if (selectedMember.image && !selectedMember.image.includes('default-member')) {
          formData.append('currentImage', selectedMember.image);
        }
      }

      const response = await fetch(url, {
        method,
        body: formData
      });

      const result = await response.json(); // Luôn parse JSON để lấy thông tin lỗi (nếu có)

      if (response.ok) {
        setIsModalOpen(false);
        setSelectedMember(null);
        fetchMembers(); // Tải lại danh sách
        alert(selectedMember ? 'Cập nhật thành công!' : 'Thêm thành viên thành công!');
      } else {
        // Ném lỗi với thông điệp từ server hoặc thông điệp mặc định
        throw new Error(result.error || `Không thể ${selectedMember ? 'cập nhật' : 'thêm'} thành viên.`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      // Hiển thị lỗi cho người dùng
      alert(error instanceof Error ? error.message : 'Đã xảy ra lỗi khi gửi biểu mẫu.');
      // setSubmitError(error instanceof Error ? error.message : 'Đã xảy ra lỗi.'); // Cập nhật state lỗi
    }
  };

  const handleDelete = async (memberId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thành viên này?')) {
      return;
    }

    try {
      const response = await fetch(`/api/member/${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchMembers(); // Tải lại danh sách
        alert('Xóa thành viên thành công!');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Không thể xóa thành viên.');
      }
    } catch (error) {
      console.error('Error deleting member:', error);
      alert(error instanceof Error ? error.message : 'Đã xảy ra lỗi khi xóa.');
    }
  };

  const handleAddClick = () => {
    setSelectedMember(null); // Đảm bảo không có member nào được chọn khi thêm mới
    setIsModalOpen(true);
  };

  const handleEditClick = (member: Member) => {
    setSelectedMember(member);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Quản lý Thành viên</h1>
        {/* Nhóm tìm kiếm và nút thêm - Đã cập nhật styling */}
        <div className="flex items-center space-x-4">
          {/* Bọc input và icon trong một div relative */}
          <div className="relative">
            {/* Icon kính lúp (SVG) */}
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {/* Input field - Cập nhật class */}
            <input
              type="text"
              placeholder="Tìm theo tên, vai trò..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" // Các class được cập nhật/thêm mới
            />
          </div>
          <button
            onClick={handleAddClick}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 whitespace-nowrap text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" // Cập nhật class để đồng bộ style
          >
            Thêm thành viên
          </button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto"> {/* Thêm overflow-x-auto */}
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Bỏ width cố định để trình duyệt tự chia */}
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thành viên
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vai trò
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Sử dụng filteredMembers */}
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member) => (
                <tr key={member._id.toString()}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        className="h-10 w-10 rounded-full object-cover flex-shrink-0" // Thêm flex-shrink-0
                        src={member.image || '/default-member.png'}
                        alt={member.name}
                        onError={(e) => (e.currentTarget.src = '/default-member.png')} // Xử lý lỗi ảnh
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {/* Có thể thêm style tùy chỉnh cho từng vai trò nếu cần */}
                    <span className="text-sm text-gray-900">
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}>{member.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditClick(member)} // Sử dụng handleEditClick
                      className="text-indigo-600 hover:text-indigo-900 mr-4" // Đổi màu và thêm margin
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(member._id.toString())}
                      className="text-red-600 hover:text-red-900"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  Không tìm thấy thành viên nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"> {/* Thêm max-height và overflow */}
            <h2 className="text-xl font-bold mb-4">
              {selectedMember ? 'Sửa thành viên' : 'Thêm thành viên mới'}
            </h2>
            <MemberForm
              member={selectedMember}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsModalOpen(false);
                setSelectedMember(null); // Reset khi đóng modal
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}