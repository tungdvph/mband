'use client';
import { useState, useEffect } from 'react';
import BookingForm from '@/components/admin/BookingForm';

interface IBooking {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  eventId: {
    _id: string;
    title: string;
    date: string;
  };
  ticketCount: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export default function BookingManagement() {
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<IBooking | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/booking');
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      const url = currentBooking?._id 
        ? `/api/booking/${currentBooking._id}` 
        : '/api/booking';
      
      const method = currentBooking?._id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchBookings();
        setIsModalOpen(false);
        setCurrentBooking(null);
        alert(currentBooking?._id ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa đặt lịch này?')) {
      try {
        const response = await fetch(`/api/booking/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          fetchBookings();
          alert('Xóa thành công!');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Có lỗi xảy ra khi xóa');
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý Đặt lịch</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Thêm mới
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {currentBooking ? 'Cập nhật đặt lịch' : 'Thêm đặt lịch mới'}
            </h2>
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
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Người đặt
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sự kiện
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Số lượng vé
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tổng tiền
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
            {bookings.map((booking) => (
              <tr key={booking._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {booking.userId.name} ({booking.userId.email})
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {booking.eventId.title} ({new Date(booking.eventId.date).toLocaleDateString()})
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {booking.ticketCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {booking.totalPrice.toLocaleString('vi-VN')} VNĐ
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {booking.status === 'confirmed' ? 'Đã xác nhận' :
                     booking.status === 'cancelled' ? 'Đã hủy' :
                     'Chờ xác nhận'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => {
                      setCurrentBooking(booking);
                      setIsModalOpen(true);
                    }}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(booking._id)}
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