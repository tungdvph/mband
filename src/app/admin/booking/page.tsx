// /app/admin/booking/page.tsx (hoặc .js)
'use client';
import { useState, useEffect } from 'react';
import BookingForm from '@/components/admin/BookingForm'; // Đảm bảo đường dẫn đúng
import { IBooking } from '@/types/booking'; // Đảm bảo đường dẫn đúng

export default function BookingManagement() {
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<IBooking | null>(null);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/booking'); // API endpoint để lấy danh sách
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      } else {
        console.error('Failed to fetch bookings');
        alert('Không thể tải danh sách đặt lịch.');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      alert('Lỗi khi tải danh sách đặt lịch.');
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleAddBooking = () => {
    setCurrentBooking(null); // Đảm bảo form trống khi thêm mới
    setIsModalOpen(true);
  };

  const handleEditBooking = (booking: IBooking) => {
    setCurrentBooking(booking);
    setIsModalOpen(true);
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đặt lịch này?')) {
      try {
        const response = await fetch(`/api/booking/${bookingId}`, { // API endpoint để xóa
          method: 'DELETE',
        });

        if (response.ok) {
          setBookings(bookings.filter(booking => booking._id !== bookingId));
          alert('Xóa thành công!');
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Có lỗi xảy ra khi xóa' }));
          alert(`Lỗi: ${errorData.error || 'Không thể xóa đặt lịch'}`);
        }
      } catch (error) {
        console.error('Error deleting booking:', error);
        alert('Có lỗi xảy ra khi xóa đặt lịch.');
      }
    }
  };

  const handleSubmit = async (formDataFromForm: any) => {
    // Chuyển đổi các giá trị số nếu cần (FormData sẽ gửi mọi thứ dưới dạng string)
    // API sẽ xử lý việc chuyển đổi này khi nhận FormData
    const submitData = new FormData();
    submitData.append('eventName', formDataFromForm.eventName);
    submitData.append('eventDate', formDataFromForm.eventDate); // Giữ dạng datetime-local string
    submitData.append('location', formDataFromForm.location);
    submitData.append('eventType', formDataFromForm.eventType);
    submitData.append('duration', formDataFromForm.duration.toString());
    submitData.append('expectedGuests', formDataFromForm.expectedGuests.toString());
    submitData.append('requirements', formDataFromForm.requirements || '');
    submitData.append('budget', formDataFromForm.budget?.toString() || '0');
    submitData.append('status', formDataFromForm.status);
    submitData.append('contactName', formDataFromForm.contactName);
    submitData.append('contactPhone', formDataFromForm.contactPhone);
    submitData.append('contactEmail', formDataFromForm.contactEmail);
    // Không cần thêm userId nếu không quản lý trong form này

    try {
      const url = currentBooking?._id
        ? `/api/booking/${currentBooking._id}` // API endpoint để cập nhật
        : '/api/booking'; // API endpoint để tạo mới

      const method = currentBooking?._id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        body: submitData, // Gửi FormData
        // Không cần 'Content-Type', trình duyệt sẽ tự đặt đúng cho FormData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Có lỗi xảy ra' }));
        throw new Error(errorData.error || `Không thể ${currentBooking ? 'cập nhật' : 'thêm mới'}`);
      }

      await fetchBookings(); // Tải lại danh sách
      setIsModalOpen(false);
      setCurrentBooking(null); // Reset current booking
      alert(currentBooking ? 'Cập nhật thành công!' : 'Thêm mới thành công!');

    } catch (error) {
      console.error('Error submitting booking:', error);
      alert(error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu đặt lịch.');
    }
  };

  const formatCurrency = (value: number | undefined | null) => {
    if (value === null || value === undefined) return 'N/A';
    return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  }

  const formatDate = (dateString: string | Date | undefined | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      // Kiểm tra xem date có hợp lệ không
      if (isNaN(date.getTime())) {
        return 'Ngày không hợp lệ';
      }
      // Sử dụng toLocaleString để có cả ngày và giờ
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        // timeZone: 'Asia/Ho_Chi_Minh' // Có thể chỉ định múi giờ nếu cần
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return 'Ngày không hợp lệ';
    }
  }


  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý Đặt lịch Sự kiện</h1>
        <button
          onClick={handleAddBooking}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Thêm đặt lịch
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {currentBooking ? 'Chi tiết Đặt lịch' : 'Thêm Đặt lịch Mới'}
            </h2>
            <BookingForm
              booking={currentBooking} // Truyền dữ liệu booking hiện tại (hoặc null)
              onSubmit={handleSubmit}
              onClose={() => {
                setIsModalOpen(false);
                setCurrentBooking(null); // Reset khi đóng modal
              }}
            />
          </div>
        </div>
      )}

      {/* Bảng hiển thị */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên sự kiện</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày & Giờ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Địa điểm</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liên hệ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">Không có dữ liệu đặt lịch.</td>
              </tr>
            )}
            {bookings.map((booking) => (
              <tr key={booking._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{booking.eventName}</div>
                  <div className="text-sm text-gray-500">({booking.expectedGuests} khách, {booking.duration} giờ)</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(booking.eventDate)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{booking.location}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {booking.eventType === 'wedding' ? 'Đám cưới' :
                    booking.eventType === 'birthday' ? 'Sinh nhật' :
                      booking.eventType === 'corporate' ? 'Công ty' :
                        booking.eventType === 'festival' ? 'Lễ hội' : 'Khác'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{booking.contactName}</div>
                  <div className="text-sm text-gray-500">{booking.contactPhone}</div>
                  <div className="text-sm text-gray-500">{booking.contactEmail}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800' // pending
                    }`}>
                    {booking.status === 'confirmed' ? 'Đã xác nhận' :
                      booking.status === 'cancelled' ? 'Đã hủy' :
                        'Chờ xác nhận'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEditBooking(booking)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDeleteBooking(booking._id)}
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
    </div>
  );
}