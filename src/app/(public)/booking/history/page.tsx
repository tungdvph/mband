'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Layout from '@/components/layout/Layout'; // Đảm bảo đường dẫn layout đúng

// Interface cho dữ liệu booking (Đã bao gồm totalPrice)
interface Booking {
    _id: string;
    scheduleId?: { // Populate từ Schedule model
        eventName?: string;
        date?: string | Date;
        // Bạn cũng có thể thêm price (giá vé đơn vị) ở đây nếu API trả về và bạn cần
        // price?: number;
    };
    createdAt: string | Date;
    ticketCount: number;
    status: 'pending' | 'confirmed' | 'cancelled';
    totalPrice?: number; // Tổng tiền cho lượt booking này
}

// *** MỚI: Hàm format giá vé (Tương tự trang schedule, nhưng thêm xử lý null/undefined) ***
const formatPrice = (price: number | undefined | null): string => {
    if (price === undefined || price === null) {
        return 'N/A'; // Hoặc 'Chưa có', tùy ý
    }
    if (price === 0) {
        return 'Miễn phí';
    }
    // Định dạng tiền tệ Việt Nam
    return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
};


export default function BookingHistoryPage() {
    const { data: session, status } = useSession();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'authenticated') {
            console.log('User authenticated, fetching bookings from /api/user/me/booking');
            setError(null);
            setLoading(true);

            fetch('/api/user/me/booking')
                .then(res => {
                    if (res.status === 401) {
                        throw new Error('Phiên đăng nhập hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.');
                    }
                    if (!res.ok) {
                        return res.json().then(errData => {
                            throw new Error(errData.error || `Lỗi ${res.status}: Không thể tải lịch sử đặt vé`);
                        }).catch(() => {
                            throw new Error(`Lỗi ${res.status}: Không thể tải lịch sử đặt vé`);
                        });
                    }
                    return res.json();
                })
                .then((data: Booking[]) => {
                    console.log('Bookings data received:', data);
                    // Kiểm tra xem API có trả về totalPrice không
                    if (data.length > 0) {
                        console.log('Example booking totalPrice:', data[0].totalPrice);
                    }
                    setBookings(Array.isArray(data) ? data : []);
                })
                .catch(error => {
                    console.error("Failed to fetch bookings:", error);
                    setError(error.message);
                    setBookings([]);
                })
                .finally(() => {
                    console.log('Finished fetching, setting loading to false');
                    setLoading(false);
                });
        } else if (status === 'unauthenticated') {
            setLoading(false);
            setBookings([]);
            setError(null);
        } else {
            setError(null);
            setLoading(true);
        }
    }, [status]);

    const renderContent = () => {
        if (status === 'loading') {
            return <div className="text-center py-10">Đang kiểm tra trạng thái đăng nhập...</div>;
        }
        if (status === 'unauthenticated') {
            return <div className="text-center py-10 text-red-500">Bạn cần đăng nhập để xem lịch sử đặt vé.</div>;
        }
        if (loading) {
            return <div className="text-center py-10">Đang tải lịch sử đặt vé...</div>;
        }
        if (error) {
            return <div className="text-center py-10 text-red-500">Lỗi: {error}</div>;
        }
        if (bookings.length === 0) {
            return <div className="text-gray-500 text-center py-10">Bạn chưa có lượt đặt vé nào.</div>;
        }

        // *** SỬA: Hiển thị bảng với cột Tổng tiền ***
        return (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sự kiện / Ngày diễn ra</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày đặt</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Số vé</th>
                            {/* *** MỚI/BỎ COMMENT: Thêm header cho cột Tổng tiền *** */}
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng tiền</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {bookings.map((booking) => (
                            <tr key={booking._id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{booking.scheduleId?.eventName || 'Không rõ sự kiện'}</div>
                                    <div className="text-sm text-gray-500">
                                        {booking.scheduleId?.date ? new Date(booking.scheduleId.date).toLocaleDateString('vi-VN') : 'N/A'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(booking.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{booking.ticketCount}</td>
                                {/* *** MỚI/BỎ COMMENT: Thêm ô dữ liệu cho Tổng tiền *** */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                    {formatPrice(booking.totalPrice)} {/* Sử dụng hàm formatPrice */}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800' // Mặc định là pending
                                        }`}>
                                        {booking.status === 'confirmed' ? 'Đã xác nhận' : booking.status === 'cancelled' ? 'Đã hủy' : 'Chờ xác nhận'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <Layout>
            <div className="container mx-auto px-4 py-10">
                <h1 className="text-2xl font-bold mb-6 text-center sm:text-left">Lịch sử đặt vé của bạn</h1>
                {renderContent()}
            </div>
        </Layout>
    );
}