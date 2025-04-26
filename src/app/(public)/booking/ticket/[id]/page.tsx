'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { Schedule } from '@/types/schedule';
import Link from 'next/link';

export default function TicketBookingPage() {
    const params = useParams();
    const id = params?.id as string;

    const [schedule, setSchedule] = useState<Schedule | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [ticketCount, setTicketCount] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState('cod'); // Đổi thành 'cod' làm mặc định
    const [cardNumber, setCardNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvv, setCvv] = useState('');
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
                        throw new Error('Failed to fetch schedule details');
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
        }
    }, [id]);

    const handleBookTicket = async () => {
        if (!schedule) return;

        try {
            const response = await fetch('/api/ticket-booking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    scheduleId: schedule._id,
                    ticketCount,
                    paymentMethod,
                    cardNumber,
                    expiryDate,
                    cvv,
                    fullName,
                    email,
                    phoneNumber,
                    address
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to book ticket');
            }

            setBookingSuccess(true);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'An unknown error occurred');
        }
    };

    if (bookingSuccess) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-16">
                    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg text-center">
                        <h1 className="text-3xl font-bold mb-4">Đặt vé thành công!</h1>
                        <p className="mb-6 text-gray-600">
                            Cảm ơn bạn đã đặt vé. Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.
                        </p>
                        <div className="flex justify-center gap-4">
                            <a
                                href="/schedule"
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Tiếp tục đặt vé
                            </a>
                            <a
                                href="/"
                                className="px-6 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                            >
                                Về trang chủ
                            </a>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }
    return (
        <Layout>
            <div className="container mx-auto px-4 py-16">
                {loading && <p className="text-center">Đang tải thông tin sự kiện...</p>}
                {error && <p className="text-center text-red-500">Lỗi: {error}</p>}

                {!loading && !error && schedule && (
                    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
                        <div className="mb-6">
                            <Link href="/schedule">
                                <span className="text-red-600 hover:text-red-700">← Quay lại</span>
                            </Link>
                        </div>
                        
                        <h1 className="text-3xl font-bold mb-4">Đặt vé cho {schedule.eventName}</h1>
                        
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng vé</label>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                                    className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                                >
                                    -
                                </button>
                                <input
                                    type="number"
                                    value={ticketCount}
                                    onChange={(e) => setTicketCount(Number(e.target.value))}
                                    min="1"
                                    className="w-20 px-3 py-2 border rounded-md text-center"
                                />
                                <button
                                    onClick={() => setTicketCount(ticketCount + 1)}
                                    className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                                >
                                    +
                                </button>
                            </div>
                            <p className="mt-2 text-sm text-gray-600">
                                Tổng giá: {(ticketCount * 100000).toLocaleString()} VND
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phương thức thanh toán</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                            >
                                <option value="cod">Thanh toán khi nhận hàng</option>
                                <option value="credit_card">Thẻ tín dụng</option>
                                <option value="debit_card">Thẻ ghi nợ</option>
                                <option value="paypal">PayPal</option>
                            </select>
                        </div>

                        {paymentMethod !== 'cod' && (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') ? (
                            <>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Số thẻ</label>
                                    <input
                                        type="text"
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md"
                                        placeholder="1234 5678 9012 3456"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Ngày hết hạn</label>
                                        <input
                                            type="text"
                                            value={expiryDate}
                                            onChange={(e) => setExpiryDate(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-md"
                                            placeholder="MM/YY"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                                        <input
                                            type="text"
                                            value={cvv}
                                            onChange={(e) => setCvv(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-md"
                                            placeholder="123"
                                        />
                                    </div>
                                </div>
                            </>
                        ) : null}

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                                placeholder="Nguyễn Văn A"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                                placeholder="example@domain.com"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                                placeholder="0987654321"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ</label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                                placeholder="Số nhà, đường, phường, quận, thành phố"
                            />
                        </div>

                        <button
                            onClick={handleBookTicket}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Đặt vé
                        </button>
                    </div>
                )}
            </div>
        </Layout>
    );
}