// src/app/(public)/schedule/page.tsx
'use client';

import { useState, useEffect } from 'react';
// import Link from 'next/link'; // Có thể không cần nếu không còn Link nào khác trong file
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Layout from '@/components/layout/Layout'; // Đảm bảo đường dẫn đúng
import { Schedule } from '@/types/schedule';    // Đảm bảo đường dẫn đúng

// Hàm format ngày giờ
const formatDate = (dateString: string | Date | undefined | null): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch (e) {
    console.error("Invalid date format:", dateString, e);
    return 'Ngày không hợp lệ';
  }
}

export default function ScheduleListPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false); // State kiểm soát hiển thị thông báo

  const { data: session, status } = useSession(); // Hook lấy thông tin session
  const router = useRouter(); // Hook để điều hướng

  // Effect fetch dữ liệu lịch trình khi component mount
  useEffect(() => {
    const fetchSchedules = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/schedule'); // Endpoint API lịch trình
        if (!response.ok) {
          throw new Error('Không thể tải lịch trình');
        }
        const data: Schedule[] = await response.json();
        // Có thể thêm sắp xếp hoặc filter ở đây nếu cần
        setSchedules(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định';
        setError(errorMessage);
        console.error("Error fetching schedules:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, []); // Dependency array rỗng để chạy 1 lần khi mount

  // --- Hàm xử lý sự kiện Click ---

  // Xử lý click nút "Đặt vé"
  const handleBookTicketClick = (scheduleId: string) => {
    if (status === 'loading') return; // Chờ kiểm tra xong
    if (status === 'authenticated') {
      router.push(`/booking/ticket/${scheduleId}`); // Đã đăng nhập -> đi đặt vé
    } else {
      setShowLoginPrompt(true); // Chưa đăng nhập -> hiện thông báo
    }
  };

  // Xử lý click nút "Xem chi tiết"
  const handleViewDetailsClick = (scheduleId: string) => {
    if (status === 'loading') return; // Chờ kiểm tra xong
    if (status === 'authenticated') {
      router.push(`/schedule/${scheduleId}`); // Đã đăng nhập -> xem chi tiết
    } else {
      setShowLoginPrompt(true); // Chưa đăng nhập -> hiện thông báo
    }
  };

  // Đóng khung thông báo
  const closeLoginPrompt = () => {
    setShowLoginPrompt(false);
  };

  // Điều hướng về trang chủ từ thông báo
  const handleGoHome = () => {
    router.push('/');
    closeLoginPrompt();
  };

  // Điều hướng đến trang đăng nhập từ thông báo
  const handleGoLogin = () => {
    router.push('/login');
    closeLoginPrompt();
  }

  // --- Render Component ---
  return (
    <Layout>
      {/* Container chính của trang */}
      <div className="bg-gray-50 py-16 min-h-screen">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-10 text-center text-gray-800">Lịch Trình Sắp Tới</h1>

          {/* Hiển thị trạng thái Loading */}
          {loading && (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-lg text-gray-600">Đang tải lịch trình...</p>
            </div>
          )}

          {/* Hiển thị lỗi */}
          {error && (
            <p className="text-center text-red-600 bg-red-100 p-4 rounded-md max-w-lg mx-auto shadow">
              <span className='font-semibold'>Lỗi tải dữ liệu:</span> {error}
            </p>
          )}

          {/* Hiển thị khi không có dữ liệu và không có lỗi/loading */}
          {!loading && !error && schedules.length === 0 && (
            <p className="text-center text-gray-500 text-lg mt-8">Hiện chưa có lịch trình nào được công bố.</p>
          )}

          {/* Hiển thị danh sách lịch trình */}
          {!loading && !error && schedules.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {schedules.map((schedule) => (
                // Card cho mỗi lịch trình
                <div
                  key={schedule._id}
                  className="bg-white border border-gray-200 rounded-lg p-5 shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between min-h-[320px]"
                >
                  {/* Phần nội dung text của card */}
                  <div>
                    <h2 className="text-xl font-semibold mb-3 text-indigo-700">{schedule.eventName}</h2>
                    <div className="space-y-1.5 text-sm text-gray-600 mb-3">
                      <p><span className="font-medium text-gray-800">Ngày:</span> {formatDate(schedule.date)}</p>
                      <p><span className="font-medium text-gray-800">Thời gian:</span> {schedule.startTime} {schedule.endTime ? `- ${schedule.endTime}` : ''}</p>
                      <p><span className="font-medium text-gray-800">Địa điểm:</span> {schedule.venue.name}{schedule.venue.city ? `, ${schedule.venue.city}` : ''}</p>
                    </div>
                    <p className="text-gray-500 text-sm mt-2 mb-4 line-clamp-3" title={schedule.description}>
                      {schedule.description || 'Không có mô tả.'}
                    </p>
                  </div>

                  {/* Phần nút ở cuối card */}
                  <div className="mt-auto pt-4 border-t border-gray-100 flex justify-end space-x-3">
                    {/* Nút Xem Chi Tiết */}
                    <button
                      onClick={() => handleViewDetailsClick(schedule._id)}
                      disabled={status === 'loading'}
                      className={`px-4 py-2 text-white text-xs font-medium rounded-md shadow-sm transition ease-in-out duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${status === 'loading' ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                      Xem chi tiết
                    </button>

                    {/* Nút Đặt Vé (chỉ hiển thị nếu là concert và chưa bị hủy) */}
                    {schedule.type === 'concert' && schedule.status !== 'cancelled' && (
                      <button
                        onClick={() => handleBookTicketClick(schedule._id)}
                        disabled={status === 'loading'}
                        className={`px-4 py-2 text-white text-xs font-medium rounded-md shadow-sm transition ease-in-out duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${status === 'loading' ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                      >
                        Đặt vé
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- Khung Thông báo Yêu cầu Đăng nhập (Styled giống Booking Page) --- */}
      {showLoginPrompt && (
        // Container ngoài: Định vị giữa màn hình, đè lên trên
        <div
          className="fixed inset-0 z-50 flex justify-center items-center p-4"
        // onClick={closeLoginPrompt} // Bỏ comment nếu muốn đóng khi click ra ngoài
        >
          {/* Khung nội dung thông báo: Copy style từ Booking Page */}
          <div
            className="max-w-md w-full bg-yellow-50 border border-yellow-300 p-8 rounded-lg shadow-lg text-center"
          // onClick={(e) => e.stopPropagation()} // Bỏ comment nếu có onClick ở div cha
          >
            {/* Icon */}
            <svg className="mx-auto mb-4 w-12 h-12 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
            </svg>
            {/* Tiêu đề */}
            <h2 className="text-2xl font-semibold text-yellow-800 mb-4">Yêu cầu Đăng nhập</h2>
            {/* Text */}
            <p className="text-gray-700 mb-6">
              Bạn cần đăng nhập để sử dụng tính năng này.
            </p>
            {/* Nút */}
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                onClick={handleGoLogin}
                className="px-6 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out w-full sm:w-auto"
              >
                Đăng nhập
              </button>
              <button
                onClick={handleGoHome}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md shadow hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition duration-150 ease-in-out w-full sm:w-auto"
              >
                Quay về trang chủ
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}