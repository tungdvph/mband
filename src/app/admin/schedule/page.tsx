'use client';
import { useState, useEffect } from 'react';
import { Schedule } from '@/types/schedule';
import ScheduleForm from '@/components/admin/ScheduleForm';

export default function ScheduleManagement() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | null>(null);

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/schedule'); // Sửa URL
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleAddSchedule = () => {
    setCurrentSchedule(null);
    setIsModalOpen(true);
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setCurrentSchedule(schedule);
    setIsModalOpen(true);
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lịch trình này?')) {
      try {
        const response = await fetch(`/api/schedule/${scheduleId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setSchedules(schedules.filter(schedule => schedule._id !== scheduleId));
        } else {
          alert('Có lỗi xảy ra khi xóa lịch trình');
        }
      } catch (error) {
        console.error('Error deleting schedule:', error);
        alert('Có lỗi xảy ra khi xóa lịch trình');
      }
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      const url = currentSchedule?._id 
        ? `/api/schedule/${currentSchedule._id}` 
        : '/api/schedule';

      // Tạo FormData object để khớp với API
      const submitData = new FormData();
      submitData.append('title', formData.eventName);
      submitData.append('description', formData.description || '');
      submitData.append('date', formData.date);
      submitData.append('startTime', formData.startTime);
      submitData.append('endTime', formData.endTime || '');
      submitData.append('type', formData.type);
      submitData.append('status', formData.status);
      submitData.append('venueName', formData.venue.name);
      submitData.append('venueAddress', formData.venue.address);
      submitData.append('venueCity', formData.venue.city);

      const response = await fetch(url, {
        method: currentSchedule ? 'PUT' : 'POST',
        body: submitData // Gửi FormData thay vì JSON
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Có lỗi xảy ra');
      }

      await fetchSchedules();
      setIsModalOpen(false);
      alert(currentSchedule ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu lịch trình');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý Lịch trình</h1>
        <button
          onClick={handleAddSchedule}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Thêm lịch trình
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tiêu đề
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Loại
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thời gian
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Địa điểm
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {schedules.map((schedule) => (
              <tr key={schedule._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {schedule.eventName} {/* Sửa từ title thành eventName */}
                      </div>
                      <div className="text-sm text-gray-500">
                        {schedule.description}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {schedule.type === 'concert' ? 'Biểu diễn' : // Sửa các loại type
                     schedule.type === 'rehearsal' ? 'Tập luyện' :
                     schedule.type === 'meeting' ? 'Họp' :
                     schedule.type === 'interview' ? 'Phỏng vấn' : 'Khác'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(schedule.date).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {schedule.startTime} {schedule.endTime ? `- ${schedule.endTime}` : ''} {/* Thêm startTime và endTime */}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {schedule.venue.name} {/* Sửa location thành venue */}
                  </div>
                  <div className="text-sm text-gray-500">
                    {schedule.venue.address}, {schedule.venue.city}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    schedule.status === 'scheduled' ? 'bg-green-100 text-green-800' : // Sửa các loại status
                    schedule.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {schedule.status === 'scheduled' ? 'Đã lên lịch' :
                     schedule.status === 'completed' ? 'Đã hoàn thành' :
                     'Đã hủy'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEditSchedule(schedule)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Sửa
                  </button>
                  <button 
                    onClick={() => handleDeleteSchedule(schedule._id)}
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">
              {currentSchedule ? 'Chi tiết lịch trình' : 'Thêm lịch trình mới'}
            </h2>
            <ScheduleForm
              schedule={currentSchedule}  // currentSchedule đã là Schedule | null
              onSubmit={handleSubmit}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}