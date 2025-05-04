// src/app/admin/schedule/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { Schedule } from '@/types/schedule'; // Đảm bảo type được import
import ScheduleForm from '@/components/admin/ScheduleForm';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale/vi';

export default function ScheduleManagement() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | null>(null);
  const [isLoading, setIsLoading] = useState(true); // State theo dõi trạng thái loading
  const [error, setError] = useState<string | null>(null); // State báo lỗi

  const fetchSchedules = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/schedule'); // Đảm bảo đúng URL API
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Kiểm tra data có phải là mảng không
      if (Array.isArray(data)) {
        setSchedules(data);
      } else {
        console.error("Dữ liệu trả về không phải là mảng:", data);
        setError("Định dạng dữ liệu lịch trình không hợp lệ.");
        setSchedules([]); // Đặt thành mảng rỗng để tránh lỗi map
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError(err instanceof Error ? err.message : 'Lỗi không xác định khi tải lịch trình.');
      setSchedules([]); // Đặt thành mảng rỗng khi có lỗi
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleAddSchedule = () => {
    setCurrentSchedule(null); // Đảm bảo form trống khi thêm mới
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
          // Xóa khỏi state thay vì fetch lại toàn bộ danh sách
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

      // Không cần dùng FormData nếu API của bạn chấp nhận JSON
      // Backend API (pages/api/schedule/index.ts và [id].ts) cần được điều chỉnh
      // để đọc req.body thay vì dùng formidable/multer nếu không gửi FormData
      const body = JSON.stringify({
        eventName: formData.eventName,
        description: formData.description,
        date: formData.date, // Đảm bảo định dạng date đúng yêu cầu của backend
        startTime: formData.startTime,
        endTime: formData.endTime || null, // Gửi null nếu endTime rỗng
        venue: formData.venue,
        type: formData.type,
        status: formData.status,
        price: formData.price // <<< THÊM: Gửi giá vé (đã là number hoặc undefined từ form)
      });

      const response = await fetch(url, {
        method: currentSchedule ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json', // <<< QUAN TRỌNG: Đặt header là JSON
        },
        body: body // Gửi JSON string
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Lỗi không xác định' }));
        throw new Error(errorData.error || `Lỗi ${response.status}`);
      }

      // Cập nhật state hoặc fetch lại
      await fetchSchedules(); // Hoặc cập nhật state trực tiếp để tối ưu
      setIsModalOpen(false);
      alert(currentSchedule ? 'Cập nhật thành công!' : 'Thêm mới thành công!');

    } catch (error) {
      console.error('Error saving schedule:', error);
      alert(error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu lịch trình');
    }
  };

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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Quản lý Lịch trình</h1>
        <button
          onClick={handleAddSchedule}
          className="bg-indigo-600 text-white px-5 py-2 rounded-md shadow hover:bg-indigo-700 transition duration-150 ease-in-out text-sm font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Thêm lịch trình
        </button>
      </div>

      {/* Hiển thị trạng thái loading hoặc lỗi */}
      {isLoading && <p className="text-center text-gray-500 py-4">Đang tải dữ liệu...</p>}
      {error && <p className="text-center text-red-500 py-4">Lỗi: {error}</p>}

      {!isLoading && !error && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sự kiện
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
                {/* <<< THÊM Cột Giá vé */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá vé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    Không có lịch trình nào.
                  </td>
                </tr>
              ) : (
                schedules.map((schedule) => (
                  <tr key={schedule._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {schedule.eventName}
                      </div>
                      {schedule.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {schedule.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatEventType(schedule.type)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(schedule.date)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {schedule.startTime} {schedule.endTime ? `- ${schedule.endTime}` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{schedule.venue.name}</div>
                      <div className="text-sm text-gray-500">{schedule.venue.address}, {schedule.venue.city}</div>
                    </td>
                    {/* <<< THÊM Cell hiển thị Giá vé */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {formatPrice(schedule.price)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${schedule.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                        schedule.status === 'completed' ? 'bg-green-100 text-green-800' :
                          schedule.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            schedule.status === 'postponed' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800' // Màu mặc định
                        }`}>
                        {formatEventStatus(schedule.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditSchedule(schedule)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                        aria-label={`Sửa ${schedule.eventName}`}
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteSchedule(schedule._id)}
                        className="text-red-600 hover:text-red-900"
                        aria-label={`Xóa ${schedule.eventName}`}
                      >
                        Xóa
                      </button>
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
        // Sử dụng Portal để render Modal ở cấp cao hơn nếu cần, hoặc giữ nguyên như này
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
            {/* Nút đóng có thể đặt trong form hoặc ở đây */}
            {/* <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                     Đóng
                 </button>
             </div> */}
          </div>
        </div>
      )}
    </div>
  );
}