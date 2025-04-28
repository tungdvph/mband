// /app/booking/history/page.tsx (Hoặc đường dẫn tương ứng của bạn)
'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Layout from '@/components/layout/Layout'; // Đảm bảo đường dẫn layout đúng

// Không cần khai báo User hay Session ở đây nữa vì đã có trong next-auth.d.ts

// Interface cho dữ liệu booking (Nên định nghĩa cụ thể hơn)
interface Booking {
    _id: string;
    scheduleId?: { // Có thể là null hoặc undefined nếu populate không thành công
        eventName?: string;
        date?: string | Date;
    };
    createdAt: string | Date;
    ticketCount: number;
    status: 'pending' | 'confirmed' | 'cancelled';
    totalPrice?: number; // Thêm nếu bạn muốn hiển thị tổng tiền
    // Thêm các trường khác nếu API trả về
}


export default function BookingHistoryPage() {
    // Sử dụng useSession để lấy thông tin phiên đăng nhập của người dùng
    const { data: session, status } = useSession();

    // State để lưu trữ danh sách booking, trạng thái loading và lỗi
    const [bookings, setBookings] = useState<Booking[]>([]); // Sử dụng interface Booking
    const [loading, setLoading] = useState(true); // Bắt đầu với trạng thái loading
    const [error, setError] = useState<string | null>(null); // Lưu trữ thông báo lỗi nếu có

    // useEffect để fetch dữ liệu khi trạng thái session thay đổi
    useEffect(() => {
        // Chỉ gọi API khi người dùng đã được xác thực (authenticated)
        if (status === 'authenticated') {
            console.log('User authenticated, fetching bookings from /api/user/me/booking');
            setError(null); // Xóa lỗi cũ trước khi fetch
            setLoading(true); // Bắt đầu loading cho lần fetch mới

            // Gọi API endpoint dành riêng cho việc lấy lịch sử của người dùng hiện tại
            fetch('/api/user/me/booking')
                .then(res => {
                    // Xử lý các trường hợp lỗi HTTP
                    if (res.status === 401) {
                        throw new Error('Phiên đăng nhập hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.');
                    }
                    if (!res.ok) {
                        // Cố gắng đọc thông báo lỗi từ API trả về
                        return res.json().then(errData => {
                            throw new Error(errData.error || `Lỗi ${res.status}: Không thể tải lịch sử đặt vé`);
                        }).catch(() => { // Nếu không đọc được lỗi JSON
                            throw new Error(`Lỗi ${res.status}: Không thể tải lịch sử đặt vé`);
                        });
                    }
                    return res.json(); // Parse dữ liệu JSON nếu thành công
                })
                .then((data: Booking[]) => { // Ép kiểu dữ liệu trả về thành mảng Booking[]
                    console.log('Bookings data received:', data);
                    // Đảm bảo dữ liệu nhận được là một mảng trước khi cập nhật state
                    setBookings(Array.isArray(data) ? data : []);
                })
                .catch(error => {
                    // Xử lý lỗi trong quá trình fetch hoặc parse JSON
                    console.error("Failed to fetch bookings:", error);
                    setError(error.message); // Cập nhật state lỗi để hiển thị cho người dùng
                    setBookings([]); // Xóa dữ liệu cũ nếu fetch lỗi
                })
                .finally(() => {
                    // Luôn dừng trạng thái loading sau khi fetch hoàn tất (thành công hoặc thất bại)
                    console.log('Finished fetching, setting loading to false');
                    setLoading(false);
                });
        } else if (status === 'unauthenticated') {
            // Nếu chưa đăng nhập, dừng loading và xóa dữ liệu cũ
            setLoading(false);
            setBookings([]);
            setError(null); // Xóa lỗi cũ (nếu có)
        } else { // status === 'loading' (đang kiểm tra session)
            setError(null);
            setLoading(true); // Đảm bảo đang loading khi session chưa sẵn sàng
        }
    }, [status]); // useEffect sẽ chạy lại khi 'status' thay đổi

    // Hàm render nội dung chính dựa trên trạng thái
    const renderContent = () => {
        // 1. Đang kiểm tra trạng thái đăng nhập
        if (status === 'loading') {
            return <div className="text-center py-10">Đang kiểm tra trạng thái đăng nhập...</div>;
        }

        // 2. Chưa đăng nhập
        if (status === 'unauthenticated') {
            return <div className="text-center py-10 text-red-500">Bạn cần đăng nhập để xem lịch sử đặt vé.</div>;
        }

        // 3. Đã đăng nhập, nhưng đang tải dữ liệu booking
        if (loading) {
            return <div className="text-center py-10">Đang tải lịch sử đặt vé...</div>;
        }

        // 4. Đã tải xong nhưng gặp lỗi
        if (error) {
            return <div className="text-center py-10 text-red-500">Lỗi: {error}</div>;
        }

        // 5. Tải xong, không lỗi, nhưng không có booking nào
        if (bookings.length === 0) {
            return <div className="text-gray-500 text-center py-10">Bạn chưa có lượt đặt vé nào.</div>;
        }

        // 6. Tải xong, không lỗi, có dữ liệu -> Hiển thị bảng
        return (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sự kiện / Ngày diễn ra</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày đặt</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Số vé</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                            {/* Có thể thêm cột Tổng tiền nếu cần */}
                            {/* <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng tiền</th> */}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {bookings.map((booking) => ( // Sử dụng interface Booking đã định nghĩa
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
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                            booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800' // Mặc định là pending
                                        }`}>
                                        {booking.status === 'confirmed' ? 'Đã xác nhận' : booking.status === 'cancelled' ? 'Đã hủy' : 'Chờ xác nhận'}
                                    </span>
                                </td>
                                {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {booking.totalPrice != null ? booking.totalPrice.toLocaleString('vi-VN') + ' VND' : 'N/A'}
                            </td> */}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    // Render Layout chung và gọi hàm render nội dung
    return (
        <Layout>
            <div className="container mx-auto px-4 py-10">
                <h1 className="text-2xl font-bold mb-6 text-center sm:text-left">Lịch sử đặt vé của bạn</h1>
                {/* Gọi hàm render nội dung */}
                {renderContent()}
            </div>
        </Layout>
    );
}