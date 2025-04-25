// src/app/(public)/schedule/[id]/page.tsx
'use client'; // Cần client-side để fetch dữ liệu dựa trên params

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; // Hook để lấy params từ URL
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import { Schedule } from '@/types/schedule';

// Hàm format ngày giờ chi tiết (ví dụ)
const formatDateTime = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleString('vi-VN', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: false // Hoặc true nếu muốn AM/PM
        });
    } catch (e) {
        return 'Ngày giờ không hợp lệ';
    }
}

export default function ScheduleDetailPage() {
    const params = useParams(); // Lấy object params
    const id = params?.id as string; // Lấy id từ params, ép kiểu string

    const [schedule, setSchedule] = useState<Schedule | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Chỉ fetch khi có id
        if (id) {
            const fetchScheduleDetail = async () => {
                setLoading(true);
                setError(null);
                try {
                    // Fetch từ API GET /api/schedule/[id] (sẽ tạo ở bước 3)
                    const response = await fetch(`/api/schedule/${id}`);
                    if (response.status === 404) {
                        throw new Error('Schedule not found');
                    }
                    if (!response.ok) {
                        throw new Error('Failed to fetch schedule details');
                    }
                    const data: Schedule = await response.json();
                    setSchedule(data);
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'An unknown error occurred');
                    console.error("Error fetching schedule detail:", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchScheduleDetail();
        } else {
            // Xử lý trường hợp không có ID (ít xảy ra nếu routing đúng)
            setError("Schedule ID is missing.");
            setLoading(false);
        }
    }, [id]); // Fetch lại nếu id thay đổi

    return (
        <Layout>
            <div className="container mx-auto px-4 py-16">
                {loading && <p className="text-center">Đang tải chi tiết lịch trình...</p>}

                {error && (
                    <div className="text-center text-red-500">
                        <p>Lỗi: {error}</p>
                        <Link href="/schedule" className="text-blue-600 hover:underline mt-4 inline-block">
                            Quay lại danh sách lịch trình
                        </Link>
                    </div>
                )}

                {!loading && !error && schedule && (
                    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
                        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-blue-800">{schedule.eventName}</h1>

                        <div className="mb-6 space-y-2 text-gray-700">
                            <p><strong>Ngày diễn ra:</strong> {formatDateTime(schedule.date)}</p>
                            <p><strong>Thời gian:</strong> {schedule.startTime} {schedule.endTime ? `- ${schedule.endTime}` : ''}</p>
                            <p><strong>Loại hình:</strong> {
                                schedule.type === 'concert' ? 'Biểu diễn' :
                                    schedule.type === 'rehearsal' ? 'Tập luyện' :
                                        schedule.type === 'meeting' ? 'Họp' :
                                            schedule.type === 'interview' ? 'Phỏng vấn' : 'Khác'
                            }</p>
                            <p><strong>Trạng thái:</strong> <span className={`font-semibold ${schedule.status === 'scheduled' ? 'text-green-600' :
                                schedule.status === 'completed' ? 'text-blue-600' :
                                    'text-red-600' // cancelled
                                }`}>
                                {schedule.status === 'scheduled' ? 'Đã lên lịch' :
                                    schedule.status === 'completed' ? 'Đã hoàn thành' : 'Đã hủy'}
                            </span>
                            </p>
                        </div>

                        <div className="mb-6 border-t pt-6">
                            <h2 className="text-2xl font-semibold mb-3 text-gray-800">Địa điểm tổ chức</h2>
                            <p><strong>Tên địa điểm:</strong> {schedule.venue.name}</p>
                            <p><strong>Địa chỉ:</strong> {schedule.venue.address}</p>
                            <p><strong>Thành phố:</strong> {schedule.venue.city}</p>
                        </div>

                        {schedule.description && (
                            <div className="mb-6 border-t pt-6">
                                <h2 className="text-2xl font-semibold mb-3 text-gray-800">Mô tả chi tiết</h2>
                                {/* Sử dụng whitespace-pre-wrap để giữ định dạng xuống dòng */}
                                <p className="text-gray-700 whitespace-pre-wrap">{schedule.description}</p>
                            </div>
                        )}

                        {/* Nút Đặt vé ở trang chi tiết */}
                        <div className="mt-8 border-t pt-8 text-center">
                            {schedule.type === 'concert' && schedule.status === 'scheduled' && ( // Chỉ hiển thị nếu là concert và chưa hủy/hoàn thành
                                <Link
                                    // href={`/booking/ticket/${schedule._id}`} // Link tới trang đặt vé (sẽ tạo sau)
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); alert('Chức năng Đặt vé sắp ra mắt!'); }}
                                    className="inline-block px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-lg font-semibold"
                                >
                                    Đặt vé ngay
                                </Link>
                            )}
                            <Link href="/schedule" className="block text-blue-600 hover:underline mt-6">
                                &larr; Quay lại danh sách lịch trình
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}