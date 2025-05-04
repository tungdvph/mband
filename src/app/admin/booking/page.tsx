// /app/admin/booking/page.tsx
'use client';
import { useState, useEffect, useMemo } from 'react'; // Thêm useMemo
import BookingForm from '@/components/admin/BookingForm'; // Đảm bảo đường dẫn đúng
import { IBooking } from '@/types/booking'; // Đảm bảo đường dẫn đúng
import { format } from 'date-fns'; // Đã có sẵn
import { vi } from 'date-fns/locale/vi'; // Đã có sẵn

export default function BookingManagement() {
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<IBooking | null>(null);
  const [searchTerm, setSearchTerm] = useState(''); // State tìm kiếm
  const [isLoading, setIsLoading] = useState(true); // State loading
  const [error, setError] = useState<string | null>(null); // State báo lỗi

  // Hàm fetch danh sách đặt lịch
  const fetchBookings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/booking'); // API endpoint để lấy danh sách
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setBookings(data);
      } else {
        console.error("Dữ liệu trả về không phải là mảng:", data);
        setError("Định dạng dữ liệu đặt lịch không hợp lệ.");
        setBookings([]);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err instanceof Error ? err.message : 'Lỗi không xác định khi tải danh sách đặt lịch.');
      setBookings([]); // Đặt mảng rỗng khi lỗi
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch khi component mount
  useEffect(() => {
    fetchBookings();
  }, []);

  // === CÁC HÀM FORMATTER ===
  const formatCurrency = (value: number | undefined | null): string => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A'; // Check cả NaN
    return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  }

  const formatFullDateTime = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Ngày không hợp lệ';
      }
      return format(date, 'dd/MM/yyyy HH:mm', { locale: vi }); // Định dạng cụ thể
    } catch (e) {
      console.error("Error formatting date:", e);
      return 'Ngày không hợp lệ';
    }
  }

  const formatEventType = (type: IBooking['eventType'] | undefined): string => {
    if (!type) return 'N/A';
    switch (type) {
      case 'wedding': return 'Đám cưới';
      case 'birthday': return 'Sinh nhật';
      case 'corporate': return 'Công ty';
      case 'festival': return 'Lễ hội';
      case 'other': return 'Khác';
      default: return type;
    }
  }

  const formatBookingStatus = (status: IBooking['status'] | undefined): string => {
    if (!status) return 'N/A';
    switch (status) {
      case 'confirmed': return 'Đã xác nhận';
      case 'cancelled': return 'Đã hủy';
      case 'pending': return 'Chờ xác nhận';
      default: return status;
    }
  }

  // === LOGIC TÌM KIẾM ===
  const filteredBookings = useMemo(() => {
    if (!searchTerm) {
      return bookings; // Trả về toàn bộ nếu không tìm kiếm
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return bookings.filter(booking =>
      booking.eventName.toLowerCase().includes(lowerCaseSearchTerm) ||
      booking.location.toLowerCase().includes(lowerCaseSearchTerm) ||
      booking.contactName.toLowerCase().includes(lowerCaseSearchTerm) ||
      booking.contactPhone.includes(lowerCaseSearchTerm) || // Phone thường không cần lowercase
      booking.contactEmail.toLowerCase().includes(lowerCaseSearchTerm) ||
      formatEventType(booking.eventType).toLowerCase().includes(lowerCaseSearchTerm) || // Tìm theo tên loại TV
      formatBookingStatus(booking.status).toLowerCase().includes(lowerCaseSearchTerm) // Tìm theo trạng thái TV
    );
  }, [bookings, searchTerm]); // Tính toán lại khi bookings hoặc searchTerm thay đổi


  // === CÁC HÀM HANDLER ===
  const handleAddBooking = () => {
    setCurrentBooking(null);
    setIsModalOpen(true);
  };

  const handleEditBooking = (booking: IBooking) => {
    setCurrentBooking(booking);
    setIsModalOpen(true);
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đặt lịch này?')) {
      try {
        const response = await fetch(`/api/booking/${bookingId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // Cập nhật state trực tiếp
          setBookings(prevBookings => prevBookings.filter(booking => booking._id !== bookingId));
          alert('Xóa đặt lịch thành công!');
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Có lỗi xảy ra khi xóa' }));
          throw new Error(errorData.error || `Lỗi ${response.status} khi xóa`);
        }
      } catch (error) {
        console.error('Error deleting booking:', error);
        alert(error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa đặt lịch.');
      }
    }
  };

  const handleSubmit = async (formDataFromForm: any) => {
    // Tạo FormData để gửi (nếu API backend xử lý FormData)
    // Hoặc tạo object JSON nếu API backend xử lý JSON
    // Ví dụ này giả sử backend xử lý JSON (thường dễ hơn nếu không có upload file)

    const isEditing = !!currentBooking?._id;

    const submitData = {
      eventName: formDataFromForm.eventName,
      eventDate: formDataFromForm.eventDate, // API nên parse string này thành Date
      location: formDataFromForm.location,
      eventType: formDataFromForm.eventType,
      duration: Number(formDataFromForm.duration) || 0, // Chuyển sang số
      expectedGuests: Number(formDataFromForm.expectedGuests) || 0, // Chuyển sang số
      requirements: formDataFromForm.requirements || '',
      budget: Number(formDataFromForm.budget) || undefined, // Chuyển sang số hoặc undefined
      status: formDataFromForm.status,
      contactName: formDataFromForm.contactName,
      contactPhone: formDataFromForm.contactPhone,
      contactEmail: formDataFromForm.contactEmail,
    };

    try {
      const url = isEditing
        ? `/api/booking/${currentBooking._id}`
        : '/api/booking';

      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json', // Gửi JSON
        },
        body: JSON.stringify(submitData), // Chuỗi hóa JSON
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Có lỗi xảy ra' }));
        throw new Error(errorData.error || `Không thể ${isEditing ? 'cập nhật' : 'thêm mới'}`);
      }

      await fetchBookings(); // Tải lại danh sách
      setIsModalOpen(false);
      setCurrentBooking(null);
      alert(isEditing ? 'Cập nhật thành công!' : 'Thêm mới thành công!');

    } catch (error) {
      console.error('Error submitting booking:', error);
      alert(error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu đặt lịch.');
    }
  };


  // === RENDER COMPONENT ===
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Đặt lịch</h1>
        <div className="flex items-center space-x-4">
          {/* Ô tìm kiếm */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Tìm tên sự kiện, liên hệ, địa điểm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
            />
          </div>
          {/* Nút thêm */}
          <button
            onClick={handleAddBooking}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Thêm đặt lịch
          </button>
        </div>
      </div>

      {/* Loading / Error State */}
      {isLoading && <p className="text-center text-gray-500 py-4">Đang tải danh sách...</p>}
      {error && <p className="text-center text-red-500 py-4">Lỗi: {error}</p>}

      {/* Bảng hiển thị */}
      {!isLoading && !error && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sự kiện</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày & Giờ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Địa điểm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liên hệ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th> {/* Căn phải */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Sử dụng filteredBookings */}
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    {searchTerm ? 'Không tìm thấy đặt lịch nào phù hợp.' : 'Chưa có đặt lịch nào.'}
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    {/* Sự kiện & Chi tiết */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{booking.eventName}</div>
                      <div className="text-xs text-gray-500">
                        {booking.expectedGuests} khách / {booking.duration} giờ
                      </div>
                      {booking.budget !== undefined && booking.budget > 0 && (
                        <div className="text-xs text-green-600">{formatCurrency(booking.budget)}</div>
                      )}
                    </td>
                    {/* Loại */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatEventType(booking.eventType)}
                    </td>
                    {/* Ngày & Giờ */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatFullDateTime(booking.eventDate)}
                    </td>
                    {/* Địa điểm */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{booking.location}</td>
                    {/* Liên hệ */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{booking.contactName}</div>
                      <div className="text-sm text-gray-500">{booking.contactPhone}</div>
                      <div className="text-sm text-gray-500 truncate max-w-[150px]" title={booking.contactEmail}>{booking.contactEmail}</div>
                    </td>
                    {/* Trạng thái */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800' // pending
                        }`}>
                        {formatBookingStatus(booking.status)}
                      </span>
                    </td>
                    {/* Thao tác */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"> {/* Căn phải */}
                      <button
                        onClick={() => handleEditBooking(booking)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                        aria-label={`Sửa đặt lịch ${booking.eventName}`}
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteBooking(booking._id)}
                        className="text-red-600 hover:text-red-900"
                        aria-label={`Xóa đặt lịch ${booking.eventName}`}
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-75 transition-opacity flex items-center justify-center p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg shadow-xl transform transition-all sm:max-w-3xl w-full max-h-[90vh] overflow-y-auto"> {/* Tăng max-w nếu form dài */}
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-xl font-semibold text-gray-800" id="modal-title">
                  {currentBooking ? 'Chi tiết Đặt lịch' : 'Thêm Đặt lịch Mới'}
                </h2>
                <button
                  onClick={() => { setIsModalOpen(false); setCurrentBooking(null); }}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Đóng modal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Modal Body */}
              <BookingForm
                booking={currentBooking} // Truyền dữ liệu booking hiện tại (hoặc null)
                onSubmit={handleSubmit}
                onClose={() => { // Đổi tên prop thành onClose cho nhất quán
                  setIsModalOpen(false);
                  setCurrentBooking(null); // Reset khi đóng modal bằng nút trong form
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}