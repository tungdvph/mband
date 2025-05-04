// src/components/admin/ScheduleForm.tsx
'use client';
import { useState, useEffect } from 'react';
import { Schedule } from '@/types/schedule'; // Đảm bảo import Schedule type
// import { Member } from '@/types/member'; // Bỏ comment nếu bạn cần dùng members

interface ScheduleFormProps {
  schedule: Schedule | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const ScheduleForm = ({ schedule, onSubmit, onCancel }: ScheduleFormProps) => {
  // const [members, setMembers] = useState<Member[]>([]); // Bỏ comment nếu bạn cần dùng members
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
    status: schedule?.status || 'scheduled',
    price: schedule?.price?.toString() || '', // <<< THÊM: Khởi tạo giá vé, chuyển sang string cho input
  });

  useEffect(() => {
    // // Load members for participant selection (Bỏ comment nếu cần)
    // const fetchMembers = async () => {
    //   try {
    //     const response = await fetch('/api/members');
    //     if (response.ok) {
    //       const data = await response.json();
    //       setMembers(data);
    //     }
    //   } catch (error) {
    //     console.error('Error fetching members:', error);
    //   }
    // };
    // fetchMembers();

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
        status: schedule.status,
        price: schedule.price?.toString() || '', // <<< THÊM: Cập nhật giá vé khi schedule thay đổi
      });
    } else {
      // Reset form nếu không có schedule (thêm mới)
      setFormData({
        eventName: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        venue: { name: '', address: '', city: '' },
        type: 'concert',
        status: 'scheduled',
        price: '', // <<< THÊM: Reset giá vé
      });
    }
  }, [schedule]); // Phụ thuộc vào schedule

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name.startsWith('venue.')) {
      const venueField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        venue: {
          ...prev.venue,
          [venueField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Chuyển đổi price thành number trước khi gửi đi
    // Nếu price là chuỗi rỗng hoặc không hợp lệ, có thể gửi null hoặc 0 tùy vào logic backend
    const priceAsNumber = formData.price ? parseFloat(formData.price) : undefined; // Hoặc 0 nếu backend yêu cầu
    onSubmit({ ...formData, price: priceAsNumber });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="eventName" className="block text-sm font-medium text-gray-700">Tên sự kiện</label>
        <input
          type="text"
          id="eventName"
          name="eventName" // <<< THÊM name
          value={formData.eventName}
          onChange={handleChange} // <<< SỬA onChange
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Mô tả</label>
        <textarea
          id="description"
          name="description" // <<< THÊM name
          value={formData.description}
          onChange={handleChange} // <<< SỬA onChange
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">Ngày</label>
          <input
            type="date"
            id="date"
            name="date" // <<< THÊM name
            value={formData.date}
            onChange={handleChange} // <<< SỬA onChange
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">Giờ bắt đầu</label>
          <input
            type="time"
            id="startTime"
            name="startTime" // <<< THÊM name
            value={formData.startTime}
            onChange={handleChange} // <<< SỬA onChange
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
          {/* Có thể giữ lại phần hiển thị AM/PM nếu muốn */}
          {/* <span className="text-sm text-gray-500 mt-1">
             {formData.startTime && new Date(`2000-01-01T${formData.startTime}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
           </span> */}
        </div>
        <div>
          <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">Giờ kết thúc (tùy chọn)</label>
          <input
            type="time"
            id="endTime"
            name="endTime" // <<< THÊM name
            value={formData.endTime}
            onChange={handleChange} // <<< SỬA onChange
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {/* <<< THÊM Input cho Giá vé */}
      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-700">Giá vé (để trống nếu miễn phí)</label>
        <input
          type="number"
          id="price"
          name="price" // <<< THÊM name
          value={formData.price}
          onChange={handleChange} // <<< SỬA onChange
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          min="0" // Ngăn giá trị âm
          step="1" // Bước nhảy (tùy chọn)
          placeholder='Ví dụ: 50000'
        />
      </div>
      {/* Input cho Giá vé END */}


      <fieldset className="border p-4 rounded-md">
        <legend className="text-sm font-medium text-gray-700 px-1">Địa điểm</legend>
        <div className="space-y-2">
          <div>
            <label htmlFor="venue.name" className="sr-only">Tên địa điểm</label>
            <input
              type="text"
              id="venue.name"
              name="venue.name" // <<< THÊM name
              value={formData.venue.name}
              onChange={handleChange} // <<< SỬA onChange
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Tên địa điểm"
              required
            />
          </div>
          <div>
            <label htmlFor="venue.address" className="sr-only">Địa chỉ</label>
            <input
              type="text"
              id="venue.address"
              name="venue.address" // <<< THÊM name
              value={formData.venue.address}
              onChange={handleChange} // <<< SỬA onChange
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Địa chỉ"
              required
            />
          </div>
          <div>
            <label htmlFor="venue.city" className="sr-only">Thành phố</label>
            <input
              type="text"
              id="venue.city"
              name="venue.city" // <<< THÊM name
              value={formData.venue.city}
              onChange={handleChange} // <<< SỬA onChange
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Thành phố"
              required
            />
          </div>
        </div>
      </fieldset>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">Loại</label>
          <select
            id="type"
            name="type" // <<< THÊM name
            value={formData.type}
            onChange={handleChange} // <<< SỬA onChange
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Trạng thái</label>
          <select
            id="status"
            name="status" // <<< THÊM name
            value={formData.status}
            onChange={handleChange} // <<< SỬA onChange
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option value="scheduled">Đã lên lịch</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
            <option value="postponed">Tạm hoãn</option> {/* Thêm nếu có trong type/model */}
          </select>
        </div>
      </div>


      <div className="flex justify-end space-x-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Hủy
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {schedule ? 'Cập nhật' : 'Thêm mới'}
        </button>
      </div>
    </form>
  );
};

export default ScheduleForm;