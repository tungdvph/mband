'use client';
import { useState, useEffect } from 'react';
import { Schedule } from '@/types/schedule';
import { Member } from '@/types/member';

interface ScheduleFormProps {
  schedule?: Schedule;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
}

const ScheduleForm = ({ schedule, onSubmit, onCancel }: ScheduleFormProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    type: 'show',
    participants: [] as string[],
    status: 'pending'
  });

  useEffect(() => {
    // Load members for participant selection
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

    fetchMembers();

    if (schedule) {
      setFormData({
        title: schedule.title,
        description: schedule.description,
        date: new Date(schedule.date).toISOString().split('T')[0],
        location: schedule.location,
        type: schedule.type,
        participants: schedule.participants,
        status: schedule.status
      });
    }
  }, [schedule]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = new FormData();
    
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'participants') {
        submitData.append(key, JSON.stringify(value));
      } else {
        submitData.append(key, value.toString());
      }
    });

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Tiêu đề</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Mô tả</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Ngày</label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Địa điểm</label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Loại</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as Schedule['type'] })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        >
          <option value="show">Biểu diễn</option>
          <option value="practice">Tập luyện</option>
          <option value="meeting">Họp</option>
          <option value="other">Khác</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Thành viên tham gia</label>
        <div className="mt-2 space-y-2">
          {members.map((member) => (
            <label key={member._id.toString()} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.participants.includes(member._id.toString())}
                onChange={(e) => {
                  const memberId = member._id.toString();
                  const newParticipants = e.target.checked
                    ? [...formData.participants, memberId]
                    : formData.participants.filter(id => id !== memberId);
                  setFormData({ ...formData, participants: newParticipants });
                }}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-600">{member.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as Schedule['status'] })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        >
          <option value="pending">Chờ xác nhận</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="cancelled">Đã hủy</option>
        </select>
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
          {schedule ? 'Cập nhật' : 'Thêm'}
        </button>
      </div>
    </form>
  );
};

export default ScheduleForm;