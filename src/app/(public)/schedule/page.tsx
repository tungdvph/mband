// src/app/(public)/schedule/page.tsx
'use client'; // Giữ lại nếu cần fetch phía client hoặc có tương tác

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/layout/Layout'; // Import Layout của bạn
import { Schedule } from '@/types/schedule'; // Import interface Schedule

// Hàm format ngày giờ (ví dụ)
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
        // Fetch từ API GET /api/schedule (API này bạn đã có)
        const response = await fetch('/api/schedule');
        if (!response.ok) {
          throw new Error('Failed to fetch schedules');
        }
        const data: Schedule[] = await response.json();
        // Có thể lọc bớt lịch trình đã qua hoặc cancelled nếu muốn
        // const upcomingSchedules = data.filter(s => new Date(s.date) >= new Date() && s.status !== 'cancelled');
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
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8 text-center">Lịch Trình Sắp Tới</h1>

        {loading && <p className="text-center">Đang tải lịch trình...</p>}
        {error && <p className="text-center text-red-500">Lỗi: {error}</p>}

        {!loading && !error && schedules.length === 0 && (
          <p className="text-center text-gray-600">Hiện chưa có lịch trình nào được công bố.</p>
        )}

        {!loading && !error && schedules.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {schedules.map((schedule) => (
              <div key={schedule._id} className="border rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white flex flex-col justify-between">
                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-blue-700">{schedule.eventName}</h2>
                  <p className="text-gray-600 mb-1">
                    <span className="font-medium">Ngày:</span> {formatDate(schedule.date)}
                  </p>
                  <p className="text-gray-600 mb-1">
                    <span className="font-medium">Thời gian:</span> {schedule.startTime} {schedule.endTime ? `- ${schedule.endTime}` : ''}
                  </p>
                  <p className="text-gray-600 mb-1">
                    <span className="font-medium">Địa điểm:</span> {schedule.venue.name}, {schedule.venue.city}
                  </p>
                  <p className="text-gray-500 text-sm mt-2 mb-4 line-clamp-2" title={schedule.description}> {/* Mô tả ngắn */}
                    {schedule.description}
                  </p>
                </div>
                <div className="mt-4 flex space-x-3">
                  {/* --- Nút Xem Chi Tiết --- */}
                  <Link
                    href={`/schedule/${schedule._id}`} // Link tới trang chi tiết động
                    className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                  >
                    Xem chi tiết
                  </Link>

                  {/* --- Nút Đặt Vé --- */}
                  {/* Chỉ hiển thị nút đặt vé nếu sự kiện là concert và chưa bị hủy? (Ví dụ điều kiện) */}
                  {schedule.type === 'concert' && schedule.status !== 'cancelled' && (
                    <Link
                      href={`/booking/ticket/${schedule._id}`}
                      className="flex-1 text-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200 text-sm font-medium"
                    >
                      Đặt vé
                    </Link>
                  )}
                  {/* Có thể thêm điều kiện khác để hiển thị nút Đặt vé */}

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}