'use client';
import { useState, useEffect } from 'react';
import { Schedule } from '@/types/schedule';
import { Member } from '@/types/member';

interface ScheduleFormProps {
  schedule: Schedule | null;  // Thay đổi từ undefined sang null
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const ScheduleForm = ({ schedule, onSubmit, onCancel }: ScheduleFormProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [formData, setFormData] = useState({
    eventName: schedule?.eventName || '',
    description: schedule?.description || '',
    date: schedule?.date ? new Date(schedule.date).toISOString().split('T')[0] : '',
    startTime: schedule?.startTime || '',
    endTime: schedule?.endTime || '',
    venue: {
      name: schedule?.venue?.name || '',
      address: schedule?.venue?.address || '',
      city: schedule?.venue?.city || ''
    },
    type: schedule?.type || 'concert',
    status: schedule?.status || 'scheduled'
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
        eventName: schedule.eventName,
        description: schedule.description || '',
        date: new Date(schedule.date).toISOString().split('T')[0],
        startTime: schedule.startTime,
        endTime: schedule.endTime || '',
        venue: {
          name: schedule.venue.name,
          address: schedule.venue.address,
          city: schedule.venue.city
        },
        type: schedule.type,
        status: schedule.status
      });
    }
  }, [schedule]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Tên sự kiện</label>
        <input
          type="text"
          value={formData.eventName}
          onChange={(e) => setFormData({...formData, eventName: e.target.value})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Mô tả</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Ngày</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Giờ bắt đầu</label>
          <input
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData({...formData, startTime: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          />
          {/* Thêm phần hiển thị AM/PM */}
          <span className="text-sm text-gray-500 mt-1">
            {formData.startTime && new Date(`2000-01-01T${formData.startTime}`).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Địa điểm</label>
        <input
          type="text"
          value={formData.venue.name}
          onChange={(e) => setFormData({...formData, venue: {...formData.venue, name: e.target.value}})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          placeholder="Tên địa điểm"
          required
        />
        <input
          type="text"
          value={formData.venue.address}
          onChange={(e) => setFormData({...formData, venue: {...formData.venue, address: e.target.value}})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          placeholder="Địa chỉ"
          required
        />
        <input
          type="text"
          value={formData.venue.city}
          onChange={(e) => setFormData({...formData, venue: {...formData.venue, city: e.target.value}})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          placeholder="Thành phố"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Loại</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({...formData, type: e.target.value as Schedule['type']})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          required
        >
          <option value="concert">Biểu diễn</option>
          <option value="rehearsal">Tập luyện</option>
          <option value="meeting">Họp</option>
          <option value="interview">Phỏng vấn</option>
          <option value="other">Khác</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({...formData, status: e.target.value as Schedule['status']})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          required
        >
          <option value="scheduled">Đã lên lịch</option>
          <option value="completed">Đã hoàn thành</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded-md hover:bg-gray-100"
        >
          Hủy
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          {schedule ? 'Cập nhật' : 'Thêm mới'}
        </button>
      </div>
    </form>
  );
};

export default ScheduleForm;