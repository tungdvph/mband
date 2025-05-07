// src/app/booking/history/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Layout from '@/components/layout/Layout';
import Link from 'next/link';
// *** SỬ DỤNG TicketBooking TỪ /types/ticketBooking.ts CHO CLIENT ***
import { TicketBooking, BookedItemDetailClient } from '@/types/ticketBooking';
// Bỏ import ITicketBooking từ model nếu không dùng trực tiếp ở đây nữa
// import { ITicketBooking } from '@/lib/models/TicketBooking';


// Hàm format giá vé
const formatPrice = (price: number | undefined | null): string => {
    if (price === undefined || price === null) {
        return 'N/A';
    }
    if (price === 0) {
        return 'Miễn phí';
    }
    return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
};

// Hàm format ngày giờ
const formatDateTime = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Ngày không hợp lệ';
        return date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
    } catch (e) { return 'Lỗi định dạng ngày'; }
};

// Hàm format chỉ ngày
const formatDateOnly = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Ngày không hợp lệ';
        return date.toLocaleDateString('vi-VN');
    } catch (e) { return 'Lỗi định dạng ngày'; }
};


export default function BookingHistoryPage() {
    const { data: session, status } = useSession();
    // *** SỬ DỤNG TicketBooking (client-side type) CHO STATE ***
    const [bookings, setBookings] = useState<TicketBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'authenticated') {
            setError(null);
            setLoading(true);
            fetch('/api/user/me/booking')
                .then(res => {
                    if (res.status === 401) throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
                    if (!res.ok) return res.json().then(errData => { throw new Error(errData.message || `Lỗi ${res.status}`) }).catch(() => { throw new Error(`Lỗi ${res.status}`) });
                    return res.json();
                })
                // *** API TRẢ VỀ DỮ LIỆU KHỚP VỚI TicketBooking (client-side type) ***
                .then((data: TicketBooking[]) => {
                    const sortedData = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    setBookings(Array.isArray(sortedData) ? sortedData : []);
                })
                .catch(error => {
                    console.error("Lỗi khi tải lịch sử đặt vé:", error);
                    setError(error.message);
                    setBookings([]);
                })
                .finally(() => setLoading(false));
        } else if (status === 'unauthenticated') {
            setLoading(false);
            setBookings([]);
            setError(null);
        } else {
            setError(null);
            setLoading(true);
        }
    }, [status]);

    // *** HÀM renderEventDetails NHẬN TicketBooking (client-side type) ***
    const renderEventDetails = (booking: TicketBooking) => {
        if (booking.bookingType === 'combo') {
            return (
                <div>
                    <div className="text-sm font-semibold text-indigo-700">
                        Combo Đặt Vé ({booking.bookedItems.length} sự kiện)
                    </div>
                    <ul className="list-disc list-inside text-xs text-gray-500 mt-1">
                        {/* booking.bookedItems giờ là BookedItemDetailClient[] */}
                        {booking.bookedItems.map((item: BookedItemDetailClient, index: number) => (
                            // item.scheduleId giờ là string, không cần .toString()
                            <li key={item.scheduleId + index}>
                                {item.eventName} ({item.ticketCount} vé)
                                {item.date && ` - ${formatDateOnly(item.date)}`}
                            </li>
                        ))}
                    </ul>
                </div>
            );
        }
        // booking.scheduleId giờ là Pick<Schedule, ...> | null (client-side Schedule type)
        const schedule = booking.scheduleId;
        return (
            <div>
                <div className="text-sm font-medium text-gray-900">{schedule?.eventName || 'Không rõ sự kiện'}</div>
                <div className="text-sm text-gray-500">
                    {schedule?.date ? formatDateOnly(schedule.date) : 'N/A'}
                </div>
            </div>
        );
    };


    const renderContent = () => {
        if (status === 'loading') {
            return <div className="text-center py-10">Đang kiểm tra trạng thái đăng nhập...</div>;
        }
        if (status === 'unauthenticated') {
            return (
                <div className="text-center py-10">
                    <p className="text-red-500 mb-4">Bạn cần đăng nhập để xem lịch sử đặt vé.</p>
                    <Link href="/login" className="px-6 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700">
                        Đăng nhập
                    </Link>
                </div>
            );
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

        return (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Chi tiết Đặt Vé</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Ngày đặt</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Tổng Số vé</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Tổng tiền</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {/* booking._id giờ là string, không cần .toString() */}
                        {bookings.map((booking) => (
                            <tr key={booking._id}>
                                <td className="px-6 py-4 whitespace-normal">
                                    {renderEventDetails(booking)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDateTime(booking.createdAt)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{booking.ticketCount}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                    {formatPrice(booking.totalPrice)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                            booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
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
                <h1 className="text-3xl font-bold mb-8 text-center sm:text-left text-gray-800">Lịch sử đặt vé của bạn</h1>
                {renderContent()}
            </div>
        </Layout>
    );
}
