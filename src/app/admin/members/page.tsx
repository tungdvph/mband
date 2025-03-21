'use client';
import { useState, useEffect } from 'react';
import { Member } from '@/types/member';
import MemberForm from '@/components/admin/MemberForm';

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members');
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
      const response = await fetch('/api/members', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchMembers();
      } else {
        const error = await response.json();
        console.error('Failed to create member:', error);
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
      const response = await fetch(`/api/members?id=${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchMembers(); // Refresh the list after deletion
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
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Thêm thành viên
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">
              {selectedMember ? 'Sửa thành viên' : 'Thêm thành viên mới'}
            </h2>
            <MemberForm
              member={selectedMember || undefined}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsModalOpen(false);
                setSelectedMember(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Members list */}
      <div className="grid gap-4">
        {members.map((member: Member) => (
          <div key={member._id.toString()} className="border p-4 rounded flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img
                src={member.image || '/default-avatar.png'}
                alt={member.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h3 className="font-bold">{member.name}</h3>
                <p className="text-gray-600">{member.role}</p>
              </div>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => {
                  setSelectedMember(member);
                  setIsModalOpen(true);
                }}
                className="text-blue-500 hover:text-blue-700"
              >
                Sửa
              </button>
              <button
                onClick={() => handleDelete(member._id.toString())}
                className="text-red-500 hover:text-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}