// src/app/(public)/schedule/[id]/page.tsx
'use client'; // Cần client-side để fetch dữ liệu dựa trên params

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; // Hook để lấy params từ URL
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import { Schedule } from '@/types/schedule';
import { useCart } from '@/contexts/CartContext'; // << THÊM IMPORT
import { toast } from 'react-toastify'; // << THÊM IMPORT
import { FaShoppingCart } from 'react-icons/fa'; // << THÊM IMPORT (cho icon)

// Hàm format ngày giờ chi tiết (ví dụ)
const formatDateTime = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleString('vi-VN', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: false
        });
    } catch (e) {
        return 'Ngày giờ không hợp lệ';
    }
}

export default function ScheduleDetailPage() {
    const params = useParams();
    const id = params?.id as string;

    const [schedule, setSchedule] = useState<Schedule | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { addToCart } = useCart(); // << SỬ DỤNG HOOK useCart

    useEffect(() => {
        if (id) {
            const fetchScheduleDetail = async () => {
                setLoading(true);
                setError(null);
                try {
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
            setError("Schedule ID is missing.");
            setLoading(false);
        }
    }, [id]);

    // Hàm xử lý khi nhấn nút "Thêm vào giỏ hàng"
    const handleAddToCartDetail = () => {
        if (schedule) {
            addToCart(schedule);
            toast.success(`Đã thêm "${schedule.eventName}" vào giỏ hàng!`, {
                position: "bottom-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
            });
        }
    };

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
                                    'text-red-600' // cancelled or other statuses like postponed
                                }`}>
                                {schedule.status === 'scheduled' ? 'Đã lên lịch' :
                                    schedule.status === 'completed' ? 'Đã hoàn thành' :
                                        schedule.status === 'cancelled' ? 'Đã hủy' :
                                            schedule.status === 'postponed' ? 'Tạm hoãn' : schedule.status}
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
                                <p className="text-gray-700 whitespace-pre-wrap">{schedule.description}</p>
                            </div>
                        )}

                        {/* Nút "Thêm vào giỏ hàng" thay thế nút "Đặt vé ngay" */}
                        <div className="mt-8 border-t pt-8 text-center">
                            {schedule.type === 'concert' && schedule.status === 'scheduled' && (
                                <button
                                    onClick={handleAddToCartDetail}
                                    className="inline-flex items-center px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-lg font-semibold"
                                    title="Thêm sự kiện vào giỏ hàng"
                                >
                                    <FaShoppingCart className="mr-2" />
                                    Thêm vào giỏ hàng
                                </button>
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