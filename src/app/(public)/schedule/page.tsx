// src/app/(public)/schedule/page.tsx
'use client'; // Giữ lại nếu cần fetch phía client hoặc có tương tác

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/layout/Layout'; // Import Layout của bạn
import { Schedule } from '@/types/schedule'; // Import interface Schedule

// Hàm format ngày giờ gốc của bạn
const formatDate = (dateString: string | Date | undefined | null): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch (e) {
    return 'Ngày không hợp lệ';
  }
}

export default function ScheduleListPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchedules = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/schedule');
        if (!response.ok) {
          throw new Error('Failed to fetch schedules');
        }
        const data: Schedule[] = await response.json();
        // KHÔNG thay đổi logic fetch hay filter/sort ở đây
        setSchedules(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error("Error fetching schedules:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, []);

  return (
    <Layout>
      {/* Thêm nền xám nhẹ cho toàn bộ khu vực nội dung trang */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-10 text-center text-gray-800">Lịch Trình Sắp Tới</h1>

          {loading && <p className="text-center text-lg text-gray-600">Đang tải lịch trình...</p>}
          {/* Cải thiện hiển thị lỗi một chút */}
          {error && <p className="text-center text-red-600 bg-red-100 p-3 rounded-md max-w-md mx-auto">Lỗi: {error}</p>}

          {!loading && !error && schedules.length === 0 && (
            <p className="text-center text-gray-500 text-lg mt-8">Hiện chưa có lịch trình nào được công bố.</p>
          )}

          {!loading && !error && schedules.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {schedules.map((schedule) => (
                // --- Card Item Styling ---
                <div
                  key={schedule._id}
                  // Giữ nguyên cấu trúc flex-col, tinh chỉnh style
                  className="bg-white border border-gray-200 rounded-lg p-5 shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between min-h-[300px]" // Thêm min-height để cân đối
                >
                  {/* Phần nội dung chính của card */}
                  <div>
                    {/* Tiêu đề sự kiện */}
                    <h2 className="text-xl font-semibold mb-3 text-indigo-700">{schedule.eventName}</h2>
                    {/* Thông tin chi tiết */}
                    <div className="space-y-1.5 text-sm text-gray-600 mb-3"> {/* Tăng nhẹ space-y, giảm mb */}
                      <p>
                        <span className="font-medium text-gray-800">Ngày:</span> {formatDate(schedule.date)}
                      </p>
                      <p>
                        <span className="font-medium text-gray-800">Thời gian:</span> {schedule.startTime} {schedule.endTime ? `- ${schedule.endTime}` : ''}
                      </p>
                      <p>
                        <span className="font-medium text-gray-800">Địa điểm:</span> {schedule.venue.name}{schedule.venue.city ? `, ${schedule.venue.city}` : ''}
                      </p>
                    </div>
                    {/* Mô tả ngắn - Giữ nguyên line-clamp */}
                    <p className="text-gray-500 text-sm mt-2 mb-4 line-clamp-3" title={schedule.description}>
                      {schedule.description || 'Không có mô tả.'}
                    </p>
                  </div>

                  {/* Phần nút - Đẩy xuống dưới cùng và căn phải */}
                  <div className="mt-auto pt-4 border-t border-gray-100 flex justify-end space-x-3"> {/* Thêm mt-auto, border-t, justify-end */}

                    {/* --- Nút Xem Chi Tiết (Style mới, không dùng flex-1) --- */}
                    <Link
                      href={`/schedule/${schedule._id}`}
                      // Style nút nhất quán, nhỏ gọn hơn
                      className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition ease-in-out duration-150"
                    >
                      Xem chi tiết
                    </Link>

                    {/* --- Nút Đặt Vé (Style mới, không dùng flex-1, giữ nguyên logic điều kiện) --- */}
                    {schedule.type === 'concert' && schedule.status !== 'cancelled' && (
                      <Link
                        href={`/booking/ticket/${schedule._id}`} // Giữ nguyên link gốc
                        // Style tương tự nút Xem chi tiết, màu xanh lá
                        className="px-4 py-2 bg-green-600 text-white text-xs font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition ease-in-out duration-150"
                      >
                        Đặt vé
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}