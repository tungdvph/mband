// src/app/admin/schedule/page.tsx
'use client';
import { useState, useEffect, useMemo } from 'react';
import { Schedule } from '@/types/schedule';
import ScheduleForm from '@/components/admin/ScheduleForm';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale/vi';

export default function ScheduleManagement() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // <<< START: DI CHUYỂN CÁC HÀM FORMAT LÊN ĐẦU COMPONENT >>>
  // Hàm định dạng giá tiền
  const formatPrice = (price: number | undefined | null): string => {
    if (price === undefined || price === null || price === 0) {
      return 'Miễn phí';
    }
    return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  }

  // Hàm định dạng ngày tháng
  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi });
    } catch {
      return "Ngày không hợp lệ";
    }
  }

  // Hàm định dạng loại sự kiện
  const formatEventType = (type: Schedule['type']): string => {
    switch (type) {
      case 'concert': return 'Biểu diễn';
      case 'rehearsal': return 'Tập luyện';
      case 'meeting': return 'Họp';
      case 'interview': return 'Phỏng vấn';
      case 'other': return 'Khác';
      default: return type; // Trả về giá trị gốc nếu không khớp
    }
  }

  // Hàm định dạng trạng thái
  const formatEventStatus = (status: Schedule['status']): string => {
    switch (status) {
      case 'scheduled': return 'Đã lên lịch';
      case 'completed': return 'Đã hoàn thành';
      case 'cancelled': return 'Đã hủy';
      case 'postponed': return 'Tạm hoãn';
      default: return status;
    }
  }
  // <<< END: DI CHUYỂN CÁC HÀM FORMAT >>>


  const fetchSchedules = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/schedule');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setSchedules(data);
      } else {
        console.error("Dữ liệu trả về không phải là mảng:", data);
        setError("Định dạng dữ liệu lịch trình không hợp lệ.");
        setSchedules([]);
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError(err instanceof Error ? err.message : 'Lỗi không xác định khi tải lịch trình.');
      setSchedules([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);


  // Lọc lịch trình dựa trên searchTerm bằng useMemo
  // Bây giờ các hàm format đã được định nghĩa ở trên nên có thể gọi được
  const filteredSchedules = useMemo(() => {
    if (!searchTerm) {
      return schedules;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return schedules.filter(schedule =>
      schedule.eventName.toLowerCase().includes(lowerCaseSearchTerm) ||
      (schedule.description && schedule.description.toLowerCase().includes(lowerCaseSearchTerm)) ||
      schedule.venue.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      schedule.venue.address.toLowerCase().includes(lowerCaseSearchTerm) ||
      schedule.venue.city.toLowerCase().includes(lowerCaseSearchTerm) ||
      formatEventType(schedule.type).toLowerCase().includes(lowerCaseSearchTerm) || // OK
      formatEventStatus(schedule.status).toLowerCase().includes(lowerCaseSearchTerm) // OK
    );
  }, [schedules, searchTerm]); // Thêm các hàm format vào dependency nếu chúng có thể thay đổi (nhưng ở đây chúng không đổi)


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
          setSchedules(prevSchedules => prevSchedules.filter(schedule => schedule._id !== scheduleId));
          alert('Xóa lịch trình thành công!');
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Có lỗi xảy ra khi xóa' }));
          alert(`Lỗi khi xóa lịch trình: ${errorData.error || response.statusText}`);
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

      const body = JSON.stringify({
        eventName: formData.eventName,
        description: formData.description,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime || null,
        venue: formData.venue,
        type: formData.type,
        status: formData.status,
        price: formData.price
      });

      const response = await fetch(url, {
        method: currentSchedule ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: body
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Lỗi không xác định' }));
        throw new Error(errorData.error || `Lỗi ${response.status}`);
      }

      await fetchSchedules();
      setIsModalOpen(false);
      alert(currentSchedule ? 'Cập nhật thành công!' : 'Thêm mới thành công!');

    } catch (error) {
      console.error('Error saving schedule:', error);
      alert(error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu lịch trình');
    }
  };


  // Phần return JSX không thay đổi nhiều, chỉ cần đảm bảo vị trí các hàm format đã đúng
  return (
    <div className="p-6">
      {/* Header với ô tìm kiếm */}
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <h1 className="text-3xl font-bold text-gray-800">Quản lý Lịch trình</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Tìm sự kiện, địa điểm, loại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <button
            onClick={handleAddSchedule}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md shadow hover:bg-indigo-700 transition duration-150 ease-in-out text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 whitespace-nowrap"
          >
            Thêm lịch trình
          </button>
        </div>
      </div>

      {/* Loading/Error */}
      {isLoading && <p className="text-center text-gray-500 py-4">Đang tải dữ liệu...</p>}
      {error && <p className="text-center text-red-500 py-4">Lỗi: {error}</p>}

      {/* Table */}
      {!isLoading && !error && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            {/* thead */}
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sự kiện</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Địa điểm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá vé</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            {/* tbody */}
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    {searchTerm ? 'Không tìm thấy lịch trình nào phù hợp.' : 'Chưa có lịch trình nào.'}
                  </td>
                </tr>
              ) : (
                filteredSchedules.map((schedule) => (
                  <tr key={schedule._id} className="hover:bg-gray-50">
                    {/* Các <td> hiển thị dữ liệu */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{schedule.eventName}</div>
                      {schedule.description && <div className="text-sm text-gray-500 truncate max-w-xs">{schedule.description}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatEventType(schedule.type)}</div> {/* Gọi hàm format */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(schedule.date)}</div> {/* Gọi hàm format */}
                      <div className="text-sm text-gray-500">{schedule.startTime} {schedule.endTime ? `- ${schedule.endTime}` : ''}</div>
                    </td>
                    <td className="px-6 py-4 max-w-sm">
                      <div className="text-sm text-gray-900 break-words">{schedule.venue.name}</div>
                      <div className="text-sm text-gray-500 break-words">{schedule.venue.address}, {schedule.venue.city}</div>

                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{formatPrice(schedule.price)}</span> {/* Gọi hàm format */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${schedule.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' : schedule.status === 'completed' ? 'bg-green-100 text-green-800' : schedule.status === 'cancelled' ? 'bg-red-100 text-red-800' : schedule.status === 'postponed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {formatEventStatus(schedule.status)} {/* Gọi hàm format */}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleEditSchedule(schedule)} className="text-indigo-600 hover:text-indigo-900 mr-3" aria-label={`Sửa ${schedule.eventName}`}>Sửa</button>
                      <button onClick={() => handleDeleteSchedule(schedule._id)} className="text-red-600 hover:text-red-900" aria-label={`Xóa ${schedule.eventName}`}>Xóa</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-75 transition-opacity flex items-center justify-center p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg shadow-xl transform transition-all sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                    {currentSchedule ? 'Chi tiết lịch trình' : 'Thêm lịch trình mới'}
                  </h3>
                  <ScheduleForm
                    schedule={currentSchedule}
                    onSubmit={handleSubmit}
                    onCancel={() => setIsModalOpen(false)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}