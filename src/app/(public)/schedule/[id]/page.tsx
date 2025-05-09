'use client'; // Cần client-side để fetch dữ liệu dựa trên params

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Hook để lấy params từ URL và router
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import { Schedule } from '@/types/schedule';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'react-toastify';
import { FaShoppingCart, FaArrowLeft } from 'react-icons/fa'; // Thêm FaArrowLeft
import { useSession } from 'next-auth/react'; // Thêm useSession để kiểm tra đăng nhập

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

// Hàm format giá vé (tương tự trang schedule list)
const formatPrice = (price: number | undefined | null): string => {
    if (price === undefined || price === null) {
        return 'Chưa có giá';
    }
    if (price === 0) {
        return 'Miễn phí';
    }
    return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
};

export default function ScheduleDetailPage() {
    const params = useParams();
    const router = useRouter(); // Thêm router
    const id = params?.id as string;

    const [schedule, setSchedule] = useState<Schedule | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showLoginPromptDetail, setShowLoginPromptDetail] = useState(false); // State cho modal login

    const { addToCart } = useCart();
    const { data: session, status: sessionStatus } = useSession(); // Lấy session status

    useEffect(() => {
        if (id) {
            const fetchScheduleDetail = async () => {
                setLoading(true);
                setError(null);
                try {
                    const response = await fetch(`/api/schedule/${id}`);
                    if (response.status === 404) {
                        throw new Error('Lịch trình không tìm thấy');
                    }
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || 'Không thể tải chi tiết lịch trình');
                    }
                    const data: Schedule = await response.json();
                    setSchedule(data);
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định');
                    console.error("Lỗi khi tải chi tiết lịch trình:", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchScheduleDetail();
        } else {
            setError("Thiếu ID lịch trình.");
            setLoading(false);
        }
    }, [id]);

    // Hàm xử lý khi nhấn nút "Thêm vào giỏ hàng"
    const handleAddToCartDetail = () => {
        if (sessionStatus === 'loading') {
            toast.info("Đang kiểm tra trạng thái đăng nhập...");
            return;
        }
        if (sessionStatus !== 'authenticated') {
            setShowLoginPromptDetail(true); // Hiển thị modal yêu cầu đăng nhập
            return;
        }

        if (schedule) {
            addToCart(schedule); // addToCart từ context sẽ xử lý toast
            // << BỎ DÒNG TOAST.SUCCESS Ở ĐÂY >>
            // toast.success(`Đã thêm "${schedule.eventName}" vào giỏ hàng!`, {
            //   position: "bottom-right",
            //   autoClose: 3000,
            //   // ... các options khác
            // });
        }
    };

    // Các hàm cho modal login prompt
    const closeLoginPromptDetail = () => setShowLoginPromptDetail(false);
    const handleGoLoginDetail = () => {
        router.push('/login'); // Chuyển hướng đến trang đăng nhập
        closeLoginPromptDetail();
    };


    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <p className="ml-3 text-lg text-gray-600">Đang tải chi tiết lịch trình...</p>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-16 text-center">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md mx-auto" role="alert">
                        <strong className="font-bold">Lỗi!</strong>
                        <span className="block sm:inline"> {error}</span>
                    </div>
                    <Link href="/schedule" className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                        <FaArrowLeft className="mr-2" />
                        Quay lại danh sách
                    </Link>
                </div>
            </Layout>
        );
    }

    if (!schedule) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-16 text-center">
                    <p className="text-xl text-gray-600">Không tìm thấy thông tin lịch trình.</p>
                    <Link href="/schedule" className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                        <FaArrowLeft className="mr-2" />
                        Quay lại danh sách
                    </Link>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="bg-gray-50 min-h-screen py-12 sm:py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 md:p-10 rounded-xl shadow-2xl">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
                            {schedule.eventName}
                        </h1>

                        <div className="mb-8 space-y-3 text-gray-700 text-base sm:text-lg">
                            <p><strong>Ngày diễn ra:</strong> {formatDateTime(schedule.date)}</p>
                            <p><strong>Thời gian:</strong> {schedule.startTime} {schedule.endTime ? `- ${schedule.endTime}` : ''}</p>
                            <p><strong>Loại hình:</strong> <span className="capitalize font-medium">
                                {
                                    schedule.type === 'concert' ? 'Buổi biểu diễn' :
                                        schedule.type === 'rehearsal' ? 'Buổi tập luyện' :
                                            schedule.type === 'meeting' ? 'Buổi họp' :
                                                schedule.type === 'interview' ? 'Buổi phỏng vấn' : 'Sự kiện khác'
                                }
                            </span></p>
                            <p><strong>Trạng thái:</strong> <span className={`font-semibold px-2 py-0.5 rounded-full text-sm ${schedule.status === 'scheduled' ? 'bg-green-100 text-green-700' :
                                    schedule.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                        schedule.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                            schedule.status === 'postponed' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-100 text-gray-700'
                                }`}>
                                {schedule.status === 'scheduled' ? 'Đã lên lịch' :
                                    schedule.status === 'completed' ? 'Đã hoàn thành' :
                                        schedule.status === 'cancelled' ? 'Đã hủy' :
                                            schedule.status === 'postponed' ? 'Tạm hoãn' : schedule.status}
                            </span>
                            </p>
                            {schedule.price != null && (
                                <p><strong>Giá vé:</strong> <span className="font-semibold text-indigo-600">{formatPrice(schedule.price)}</span></p>
                            )}
                        </div>

                        <div className="mb-8 border-t border-gray-200 pt-6">
                            <h2 className="text-2xl font-semibold mb-3 text-gray-800">Địa điểm tổ chức</h2>
                            <p className="text-gray-700"><strong>Tên địa điểm:</strong> {schedule.venue.name}</p>
                            <p className="text-gray-700"><strong>Địa chỉ:</strong> {schedule.venue.address}</p>
                            <p className="text-gray-700"><strong>Thành phố:</strong> {schedule.venue.city}</p>
                        </div>

                        {schedule.description && (
                            <div className="mb-8 border-t border-gray-200 pt-6">
                                <h2 className="text-2xl font-semibold mb-3 text-gray-800">Mô tả chi tiết</h2>
                                <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">{schedule.description}</div>
                            </div>
                        )}

                        <div className="mt-10 border-t border-gray-200 pt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                            {schedule.type === 'concert' &&
                                schedule.status === 'scheduled' &&
                                schedule.price != null && schedule.price > 0 && ( // Chỉ hiển thị nếu là concert, đã lên lịch và có giá > 0
                                    <button
                                        onClick={handleAddToCartDetail}
                                        className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-lg hover:from-sky-600 hover:to-indigo-700 transition-all duration-300 text-lg font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        title="Thêm sự kiện vào giỏ hàng"
                                    >
                                        <FaShoppingCart className="mr-2" />
                                        Thêm vào giỏ hàng
                                    </button>
                                )}
                            <Link href="/schedule" className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 text-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400">
                                <FaArrowLeft className="mr-2" />
                                Quay lại danh sách
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Yêu cầu Đăng nhập */}
            {showLoginPromptDetail && (
                <div className="fixed inset-0 z-[9999] flex justify-center items-center p-4">
                    <div
                        className="fixed inset-0 bg-[rgba(0,0,0,0.5)] transition-opacity"
                        onClick={closeLoginPromptDetail}
                    ></div>
                    <div
                        className="relative max-w-md w-full bg-yellow-50 border border-yellow-300 p-8 pt-10 rounded-lg shadow-xl text-center transform transition-all scale-95 opacity-0 animate-fade-in-scale z-[10000]"
                        style={{ animationFillMode: 'forwards', animationDuration: '0.2s' }}
                    >
                        <button
                            onClick={closeLoginPromptDetail}
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 p-1 rounded-full transition-colors"
                            title="Đóng"
                            aria-label="Đóng thông báo"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <style jsx>{`
                            @keyframes fade-in-scale {
                                from { opacity: 0; transform: scale(0.95); }
                                to { opacity: 1; transform: scale(1); }
                            }
                            .animate-fade-in-scale {
                                animation-name: fade-in-scale;
                            }
                        `}</style>
                        <svg className="mx-auto mb-4 w-12 h-12 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
                        </svg>
                        <h2 className="text-2xl font-semibold text-yellow-800 mb-4">Yêu cầu Đăng nhập</h2>
                        <p className="text-gray-700 mb-6">
                            Bạn cần đăng nhập để sử dụng tính năng này.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                            <button onClick={handleGoLoginDetail} className="px-6 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out w-full sm:w-auto">
                                Đăng nhập
                            </button>
                            <button onClick={closeLoginPromptDetail} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md shadow hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition duration-150 ease-in-out w-full sm:w-auto">
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
