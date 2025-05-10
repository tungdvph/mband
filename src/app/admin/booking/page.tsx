// /app/admin/booking/page.tsx
'use client';
import { useState, useEffect, useMemo } from 'react';
import BookingForm from '@/components/admin/BookingForm'; // Đảm bảo đường dẫn đúng
// THAY ĐỔI: Import IBookingRequest từ file model
import { IBookingRequest } from '@/lib/models/BookingRequest';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale/vi';

export default function BookingManagement() {
  // THAY ĐỔI: Sử dụng IBookingRequest
  const [bookings, setBookings] = useState<IBookingRequest[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<IBookingRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/booking');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        // THAY ĐỔI: Đảm bảo dữ liệu trả về khớp với IBookingRequest
        setBookings(data as IBookingRequest[]);
      } else {
        console.error("Dữ liệu trả về không phải là mảng:", data);
        setError("Định dạng dữ liệu đặt lịch không hợp lệ.");
        setBookings([]);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err instanceof Error ? err.message : 'Lỗi không xác định khi tải danh sách đặt lịch.');
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const formatCurrency = (value: number | undefined | null): string => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  }

  const formatFullDateTime = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Ngày không hợp lệ';
      }
      return format(date, 'dd/MM/yyyy HH:mm', { locale: vi });
    } catch (e) {
      console.error("Error formatting date:", e);
      return 'Ngày không hợp lệ';
    }
  }
  // THAY ĐỔI: Sử dụng kiểu từ IBookingRequest
  const formatEventType = (type: IBookingRequest['eventType'] | undefined): string => {
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
  // THAY ĐỔI: Sử dụng kiểu từ IBookingRequest
  const formatBookingStatus = (status: IBookingRequest['status'] | undefined): string => {
    if (!status) return 'N/A';
    switch (status) {
      case 'confirmed': return 'Đã xác nhận';
      case 'cancelled': return 'Đã hủy';
      case 'pending': return 'Chờ xác nhận';
      case 'completed': return 'Đã hoàn thành'; // Thêm nếu có trong IBookingRequest
      default: return status;
    }
  }

  const filteredBookings = useMemo(() => {
    if (!searchTerm) {
      return bookings;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return bookings.filter(booking =>
      booking.eventName.toLowerCase().includes(lowerCaseSearchTerm) ||
      booking.location.toLowerCase().includes(lowerCaseSearchTerm) ||
      booking.contactName.toLowerCase().includes(lowerCaseSearchTerm) ||
      booking.contactPhone.includes(lowerCaseSearchTerm) ||
      booking.contactEmail.toLowerCase().includes(lowerCaseSearchTerm) ||
      formatEventType(booking.eventType).toLowerCase().includes(lowerCaseSearchTerm) ||
      formatBookingStatus(booking.status).toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [bookings, searchTerm]);


  const handleAddBooking = () => {
    setCurrentBooking(null);
    setIsModalOpen(true);
  };
  // THAY ĐỔI: Sử dụng IBookingRequest
  const handleEditBooking = (booking: IBookingRequest) => {
    setCurrentBooking(booking);
    setIsModalOpen(true);
  };

  const handleDeleteBooking = async (bookingId: string | undefined) => { // bookingId có thể là undefined nếu _id là optional
    if (!bookingId) {
      alert('ID đặt lịch không hợp lệ.');
      return;
    }
    if (window.confirm('Bạn có chắc chắn muốn xóa đặt lịch này?')) {
      try {
        const response = await fetch(`/api/booking/${bookingId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
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

  // THAY ĐỔI: handleSubmit để gửi FormData, giống trang public
  const handleSubmit = async (formDataFromForm: any) => {
    const isEditing = !!currentBooking?._id;

    // Tạo FormData
    const submitData = new FormData();
    submitData.append('eventName', formDataFromForm.eventName);
    // Đảm bảo eventDate từ form là string đúng định dạng mà backend mong đợi (ví dụ: YYYY-MM-DDTHH:mm)
    // BookingForm của bạn nên xử lý việc này
    submitData.append('eventDate', formDataFromForm.eventDate);
    submitData.append('location', formDataFromForm.location);
    submitData.append('eventType', formDataFromForm.eventType);
    submitData.append('duration', (Number(formDataFromForm.duration) || 0).toString());
    submitData.append('expectedGuests', (Number(formDataFromForm.expectedGuests) || 0).toString());
    submitData.append('requirements', formDataFromForm.requirements || '');
    // Chuyển budget thành string, hoặc rỗng nếu không có giá trị (backend sẽ xử lý)
    submitData.append('budget', formDataFromForm.budget ? (Number(formDataFromForm.budget) || 0).toString() : '');
    submitData.append('status', formDataFromForm.status); // status sẽ được gửi trong FormData
    submitData.append('contactName', formDataFromForm.contactName);
    submitData.append('contactPhone', formDataFromForm.contactPhone);
    submitData.append('contactEmail', formDataFromForm.contactEmail);
    // Nếu có userId và cần thiết, bạn có thể thêm vào đây
    // if (formDataFromForm.userId) {
    //     submitData.append('userId', formDataFromForm.userId);
    // }

    try {
      const url = isEditing
        ? `/api/booking/${currentBooking!._id}` // currentBooking chắc chắn có _id ở đây
        : '/api/booking';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        body: submitData, // Gửi FormData, không cần Content-Type header
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Có lỗi xảy ra' }));
        throw new Error(errorData.error || `Không thể ${isEditing ? 'cập nhật' : 'thêm mới'}`);
      }

      await fetchBookings();
      setIsModalOpen(false);
      setCurrentBooking(null);
      alert(isEditing ? 'Cập nhật thành công!' : 'Thêm mới thành công!');

    } catch (error) {
      console.error('Error submitting booking:', error);
      alert(error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu đặt lịch.');
    }
  };

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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    {searchTerm ? 'Không tìm thấy đặt lịch nào phù hợp.' : 'Chưa có đặt lịch nào.'}
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{booking.eventName}</div>
                      <div className="text-xs text-gray-500">
                        {booking.expectedGuests} khách / {booking.duration} giờ
                      </div>
                      {/* Kiểm tra budget trước khi format */}
                      {(booking.budget !== undefined && booking.budget !== null && booking.budget > 0) && (
                        <div className="text-xs text-green-600">{formatCurrency(booking.budget)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatEventType(booking.eventType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatFullDateTime(booking.eventDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{booking.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{booking.contactName}</div>
                      <div className="text-sm text-gray-500">{booking.contactPhone}</div>
                      <div className="text-sm text-gray-500 truncate max-w-[150px]" title={booking.contactEmail}>{booking.contactEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          booking.status === 'completed' ? 'bg-blue-100 text-blue-800' : // Màu cho completed
                            'bg-yellow-100 text-yellow-800' // pending hoặc các trạng thái khác
                        }`}>
                        {formatBookingStatus(booking.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditBooking(booking)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                        aria-label={`Sửa đặt lịch ${booking.eventName}`}
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteBooking(booking._id)} // Đảm bảo booking._id được truyền
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
          <div className="bg-white rounded-lg shadow-xl transform transition-all sm:max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
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
              <BookingForm
                booking={currentBooking}
                onSubmit={handleSubmit}
                onClose={() => {
                  setIsModalOpen(false);
                  setCurrentBooking(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}