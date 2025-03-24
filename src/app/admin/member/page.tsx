'use client';
import { useState, useEffect } from 'react';
import { Member } from '@/types/member';
import MemberForm from '@/components/admin/MemberForm';

export default function MemberPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const fetchMembers = async () => {
    // API path is correct: '/api/member'
    try {
      const response = await fetch('/api/member');
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleSubmit = async (formData: FormData) => {
    try {
      const method = selectedMember ? 'PUT' : 'POST';
      const url = selectedMember 
        ? `/api/member/${selectedMember._id}`
        : '/api/member';

      const response = await fetch(url, {
        method,
        body: formData
      });

      if (response.ok) {
        setIsModalOpen(false);
        setSelectedMember(null);
        fetchMembers();
      } else {
        const error = await response.json();
        console.error('Failed to save member:', error);
      }
    } catch (error) {
      console.error('Error:', error);
    }
};

  // Add this function after fetchMembers
  const handleDelete = async (memberId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thành viên này?')) {
      return;
    }

    try {
      // Sửa lại đường dẫn API
      const response = await fetch(`/api/member/${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchMembers();
      } else {
        const error = await response.json();
        console.error('Failed to delete member:', error);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };


  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý Thành viên</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Thêm thành viên
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                Thành viên
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                Vai trò
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                Trạng thái
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {members.map((member) => (
              <tr key={member._id.toString()}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img
                      className="h-10 w-10 rounded-full object-cover"
                      src={member.image || '/default-member.png'} // Changed from default-avatar.png
                      alt={member.name}
                    />
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{member.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {member.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    member.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {member.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      setSelectedMember(member);
                      setIsModalOpen(true);
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-4"
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
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">
              {selectedMember ? 'Sửa thành viên' : 'Thêm thành viên mới'}
            </h2>
            <MemberForm
              member={selectedMember}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsModalOpen(false);
                setSelectedMember(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  ); // Đóng ngoặc return ở đây
} // Đóng ngoặc function ở đây