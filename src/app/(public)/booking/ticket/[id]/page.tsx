'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { Schedule } from '@/types/schedule'; // Đảm bảo type Schedule đã được cập nhật price?: number
import Link from 'next/link';

export default function TicketBookingPage() {
    const params = useParams();
    const id = params?.id as string;

    const [schedule, setSchedule] = useState<Schedule | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [ticketCount, setTicketCount] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState('cod'); // Giữ 'cod' làm mặc định
    // Các state cho thẻ vẫn có thể giữ lại nhưng không dùng đến trong giao diện nữa
    const [cardNumber, setCardNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvv, setCvv] = useState('');
    // Các state thông tin người dùng
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [bookingSuccess, setBookingSuccess] = useState(false);

    useEffect(() => {
        if (id) {
            const fetchScheduleDetail = async () => {
                setLoading(true);
                setError(null);
                try {
                    const response = await fetch(`/api/schedule/${id}`);
                    if (!response.ok) {
                        // Cố gắng đọc lỗi chi tiết từ API nếu có
                        let errorMsg = 'Failed to fetch schedule details';
                        try {
                            const errorData = await response.json();
                            errorMsg = errorData.error || errorMsg;
                        } catch (parseError) {
                            // Không thể parse JSON, dùng lỗi mặc định
                        }
                        throw new Error(errorMsg);
                    }
                    const data: Schedule = await response.json();
                    setSchedule(data);
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'An unknown error occurred');
                } finally {
                    setLoading(false);
                }
            };
            fetchScheduleDetail();
        } else {
            setLoading(false);
            setError("Không tìm thấy ID sự kiện."); // Xử lý trường hợp không có ID
        }
    }, [id]);

    // --- Hàm xử lý giá vé (Cần thiết để hiển thị tổng giá) ---
    const getTicketPrice = (): number => {
        // Trả về giá vé từ schedule nếu có và hợp lệ, ngược lại trả về 0 hoặc một giá mặc định
        // Sử dụng optional chaining (?.) và nullish coalescing (??)
        return schedule?.price ?? 0; // Nếu price là undefined hoặc null, coi như giá là 0
    };

    const totalPrice = ticketCount * getTicketPrice();
    // --- Kết thúc hàm xử lý giá vé ---


    const handleBookTicket = async () => {
        if (!schedule) return;

        // Có thể thêm validation cơ bản ở đây (ví dụ: kiểm tra tên, email, sđt)
        if (!fullName || !email || !phoneNumber || (paymentMethod === 'cod' && !address)) {
            alert("Vui lòng điền đầy đủ thông tin bắt buộc.");
            return;
        }


        try {
            const response = await fetch('/api/ticket-booking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    bookingType: "single",
                    customerDetails: {
                        fullName,
                        email,
                        phoneNumber,
                        address: paymentMethod === 'cod' ? address : undefined
                    },
                    bookedItems: [
                        {
                            scheduleId: schedule._id,
                            eventName: schedule.eventName,
                            date: schedule.date,
                            ticketCount,
                            price: schedule.price ?? 0
                        }
                    ],
                    totalPrice: totalPrice,
                    paymentMethod
                }),
            });

            if (!response.ok) {
                // Sửa đoạn này để hiển thị lỗi chi tiết từ backend
                const errorData = await response.json().catch(() => ({ error: 'Failed to book ticket and cannot parse error' }));
                alert(errorData.error || errorData.message || 'Failed to book ticket');
                return;
            }

            setBookingSuccess(true);
        } catch (err) {
            console.error('Booking error:', err);
            alert(err instanceof Error ? err.message : 'An unknown error occurred while booking');
        }
    };

    if (bookingSuccess) {
        // --- Giao diện đặt vé thành công (Giữ nguyên) ---
        return (
            <Layout>
                <div className="container mx-auto px-4 py-16">
                    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg text-center">
                        <h1 className="text-3xl font-bold mb-4">Đặt vé thành công!</h1>
                        <p className="mb-6 text-gray-600">
                            Cảm ơn bạn đã đặt vé. Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất (nếu cần).
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link // Sử dụng Link thay cho a để điều hướng trong Next.js
                                href="/schedule"
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Tiếp tục đặt vé
                            </Link>
                            <Link // Sử dụng Link
                                href="/"
                                className="px-6 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                            >
                                Về trang chủ
                            </Link>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    // --- Giao diện chính của trang đặt vé ---
    return (
        <Layout>
            <div className="container mx-auto px-4 py-16">
                {loading && <p className="text-center">Đang tải thông tin sự kiện...</p>}
                {error && <p className="text-center text-red-500">Lỗi: {error}</p>}

                {!loading && !error && schedule && (
                    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
                        <div className="mb-6">
                            <Link href="/schedule">
                                <span className="text-red-600 hover:text-red-700">← Quay lại danh sách</span>
                            </Link>
                        </div>

                        <h1 className="text-3xl font-bold mb-4">Đặt vé cho: {schedule.eventName}</h1>
                        {/* Hiển thị thông tin cơ bản của sự kiện */}
                        <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-200 text-sm">
                            <p><strong>Ngày:</strong> {new Date(schedule.date).toLocaleDateString()}</p>
                            <p><strong>Thời gian:</strong> {schedule.startTime}{schedule.endTime ? ` - ${schedule.endTime}` : ''}</p>
                            <p><strong>Địa điểm:</strong> {schedule.venue.name} - {schedule.venue.address}, {schedule.venue.city}</p>
                            {/* Hiển thị giá vé nếu có */}
                            {getTicketPrice() > 0 && (
                                <p><strong>Giá vé:</strong> {getTicketPrice().toLocaleString()} VND / vé</p>
                            )}
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng vé</label>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                                    className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
                                    disabled={ticketCount <= 1} // Vô hiệu hóa nút trừ khi số lượng là 1
                                >
                                    -
                                </button>
                                <input
                                    type="number"
                                    value={ticketCount}
                                    // Đọc giá trị, đảm bảo là số nguyên dương
                                    onChange={(e) => {
                                        const count = parseInt(e.target.value, 10);
                                        setTicketCount(isNaN(count) || count < 1 ? 1 : count);
                                    }}
                                    min="1"
                                    className="w-20 px-3 py-2 border border-gray-300 rounded-md text-center focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <button
                                    onClick={() => setTicketCount(ticketCount + 1)}
                                    className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                                >
                                    +
                                </button>
                            </div>
                            {/* Hiển thị tổng giá */}
                            {getTicketPrice() > 0 && (
                                <p className="mt-2 text-lg font-semibold text-indigo-700">
                                    Tổng cộng: {totalPrice.toLocaleString()} VND
                                </p>
                            )}
                            {/* Hiển thị thông báo nếu vé miễn phí */}
                            {getTicketPrice() <= 0 && (
                                <p className="mt-2 text-sm text-green-600 font-medium">
                                    Sự kiện này miễn phí vé vào cửa.
                                </p>
                            )}
                        </div>

                        {/* --- Phần Thông tin người đặt --- */}
                        <h2 className="text-xl font-semibold mb-4 border-t pt-4">Thông tin người đặt</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Nguyễn Văn A"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="example@domain.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="0987654321"
                                    required
                                />
                            </div>
                        </div>

                        {/* --- Phần Thanh toán --- */}
                        <h2 className="text-xl font-semibold mb-4 border-t pt-4">Thanh toán</h2>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phương thức thanh toán</label>
                            {/* --- SELECT ĐÃ SỬA --- */}
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="cod">Thanh toán khi nhận hàng (COD)</option>
                                <option value="online">Thanh toán online</option>
                            </select>
                            {/* --- KẾT THÚC SELECT ĐÃ SỬA --- */}
                        </div>

                        {/* --- Hiển thị địa chỉ chỉ khi chọn COD --- */}
                        {paymentMethod === 'cod' && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ nhận vé/hàng <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Số nhà, đường, phường, quận, thành phố"
                                    required={paymentMethod === 'cod'} // Bắt buộc nếu là COD
                                />
                                <p className="text-xs text-gray-500 mt-1">Cần thiết nếu bạn chọn thanh toán khi nhận hàng.</p>
                            </div>
                        )}

                        {/* --- KHỐI HIỂN THỊ THÔNG BÁO KHI CHỌN ONLINE --- */}
                        {paymentMethod === 'online' && (
                            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-800">
                                <p className="text-sm font-medium">Tính năng đang hoàn thiện.</p>
                                <p className="text-xs mt-1">Chúng tôi sẽ sớm cập nhật phương thức thanh toán online. Hiện tại, bạn có thể chọn "Thanh toán khi nhận hàng" hoặc hoàn tất đặt vé và chúng tôi sẽ liên hệ hướng dẫn thanh toán sau (nếu cần).</p>
                            </div>
                        )}
                        {/* --- KẾT THÚC KHỐI THÔNG BÁO --- */}


                        {/* --- Nút Đặt vé --- */}
                        <div className="mt-8 text-center">
                            <button
                                onClick={handleBookTicket}
                                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-lg shadow-md hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150 ease-in-out disabled:opacity-60"
                            // Có thể thêm disabled nếu đang xử lý hoặc form chưa hợp lệ
                            >
                                Xác nhận đặt vé
                            </button>
                        </div>
                    </div>
                )}
                {!loading && !error && !schedule && (
                    <p className="text-center text-gray-500">Không tìm thấy thông tin sự kiện.</p> // Hiển thị nếu không có schedule sau khi load xong
                )}
            </div>
        </Layout>
    );
}