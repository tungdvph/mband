'use client';

import { useState, useEffect, useMemo } from 'react';
// *** SỬ DỤNG TicketBooking (client-side type) ***
import { TicketBooking, TicketBookingStatusUpdateData } from '@/types/ticketBooking'; // Đảm bảo type đã được cập nhật
import TicketBookingStatusForm from '@/components/admin/TicketBookingStatusForm';
import { toast } from 'react-toastify';

// --- Hàm helper ---
const formatCurrency = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) return 'N/A';
    return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}
const formatDateTime = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Ngày không hợp lệ';
        return date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
    } catch (e) { return 'Lỗi định dạng ngày'; }
}
const formatDateOnly = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Ngày không hợp lệ';
        return date.toLocaleDateString('vi-VN');
    } catch (e) { return 'Lỗi định dạng ngày'; }
}

// CẬP NHẬT HÀM NÀY
const formatBookingStatusText = (status: 'pending' | 'confirmed' | 'cancelled' | 'delivered'): string => {
    switch (status) {
        case 'confirmed': return 'Đã xác nhận';
        case 'cancelled': return 'Đã hủy';
        case 'delivered': return 'Đã giao'; // <--- THÊM CASE MỚI
        case 'pending': default: return 'Chờ xác nhận';
    }
};

// CẬP NHẬT HÀM NÀY
const renderStatusBadge = (status: 'pending' | 'confirmed' | 'cancelled' | 'delivered') => {
    let bgColor, textColor, text;
    switch (status) {
        case 'confirmed': bgColor = 'bg-green-100'; textColor = 'text-green-800'; text = 'Đã xác nhận'; break;
        case 'cancelled': bgColor = 'bg-red-100'; textColor = 'text-red-800'; text = 'Đã hủy'; break;
        case 'delivered': bgColor = 'bg-blue-100'; textColor = 'text-blue-800'; text = 'Đã giao'; break; // <--- THÊM CASE MỚI (chọn màu blue ví dụ)
        case 'pending': default: bgColor = 'bg-yellow-100'; textColor = 'text-yellow-800'; text = 'Chờ xác nhận'; break;
    }
    return <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>{text}</span>;
};
// --- Kết thúc hàm helper ---

export default function TicketBookingManagement() {
    const [bookings, setBookings] = useState<TicketBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentBooking, setCurrentBooking] = useState<TicketBooking | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchBookings = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/ticket-booking');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Không thể tải danh sách đặt vé' }));
                throw new Error(errorData.message || 'Không thể tải danh sách đặt vé');
            }
            const data: TicketBooking[] = await response.json();
            const sortedData = data.sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());
            setBookings(sortedData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra');
            console.error("Lỗi khi tải bookings:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const filteredBookings = useMemo(() => {
        if (!searchTerm) {
            return bookings;
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return bookings.filter(booking => {
            const customerName = booking.customerDetails?.fullName?.toLowerCase() || '';
            const customerEmail = booking.customerDetails?.email?.toLowerCase() || '';
            const statusText = formatBookingStatusText(booking.status).toLowerCase(); // Sẽ tự động lấy text mới

            let eventMatch = false;
            if (booking.bookingType === 'combo') {
                eventMatch = booking.bookedItems.some(item => item.eventName.toLowerCase().includes(lowerCaseSearchTerm)) ||
                    "combo".includes(lowerCaseSearchTerm);
            } else {
                const singleEventName = (booking.scheduleId as any)?.eventName?.toLowerCase() || '';
                eventMatch = singleEventName.includes(lowerCaseSearchTerm);
            }

            return customerName.includes(lowerCaseSearchTerm) ||
                customerEmail.includes(lowerCaseSearchTerm) ||
                statusText.includes(lowerCaseSearchTerm) ||
                eventMatch ||
                booking._id.toString().includes(lowerCaseSearchTerm);
        });
    }, [bookings, searchTerm]);

    const handleOpenUpdateModal = (booking: TicketBooking) => {
        setCurrentBooking(booking);
        setIsModalOpen(true);
        setError(null);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentBooking(null);
        setIsSubmitting(false);
        setError(null);
    };

    const handleDeleteBooking = async (bookingId: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa lượt đặt vé này? Hành động này không thể hoàn tác.')) {
            try {
                const response = await fetch(`/api/ticket-booking/${bookingId}`, { method: 'DELETE' });
                if (response.ok) {
                    setBookings(prev => prev.filter(b => b._id !== bookingId));
                    toast.success('Xóa đặt vé thành công!');
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || 'Không thể xóa đặt vé');
                }
            } catch (err) {
                toast.error(`Lỗi khi xóa: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`);
                console.error("Lỗi khi xóa booking:", err);
            }
        }
    };

    const handleSubmitStatusUpdate = async (data: TicketBookingStatusUpdateData) => { // data giờ có thể là 'delivered'
        if (!currentBooking) return;
        setIsSubmitting(true);
        setError(null);
        try {
            const response = await fetch(`/api/ticket-booking/${currentBooking._id.toString()}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (response.ok) {
                await fetchBookings();
                toast.success('Cập nhật trạng thái thành công!');
                handleCloseModal();
            } else {
                const errorData = await response.json().catch(() => ({}));
                setError(errorData.message || 'Không thể cập nhật trạng thái');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra');
            console.error("Lỗi khi cập nhật status:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderEventDetailsForAdmin = (booking: TicketBooking) => {
        if (booking.bookingType === 'combo') {
            return (
                <div>
                    <div className="text-sm font-semibold text-indigo-700">
                        Combo ({booking.bookedItems.length} sự kiện)
                    </div>
                    <ul className="list-disc list-inside text-xs text-gray-500 mt-1 max-h-20 overflow-y-auto">
                        {booking.bookedItems.map((item, index) => (
                            <li key={item.scheduleId.toString() + index} title={`${item.eventName} - ${formatDateOnly(item.date)} - ${item.ticketCount} vé`}>
                                {item.eventName} ({item.ticketCount} vé)
                            </li>
                        ))}
                    </ul>
                </div>
            );
        }
        const schedule = booking.scheduleId as any;
        return (
            <div>
                <div className="text-sm font-medium text-gray-900" title={schedule?.eventName}>{schedule?.eventName || 'N/A'}</div>
                <div className="text-sm text-gray-500">{formatDateOnly(schedule?.date)}</div>
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Quản lý Đặt vé</h1>
                <div className="relative w-full sm:w-auto sm:max-w-xs md:max-w-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm ID, sự kiện, người đặt, email, status..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
            </div>

            {loading && <p className="text-center py-4 text-gray-600">Đang tải dữ liệu...</p>}
            {!loading && error && !isModalOpen && <p className="text-red-600 text-center py-4 bg-red-50 p-3 rounded-md">Lỗi tải dữ liệu: {error}</p>}

            {!loading && !error && (
                <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Chi tiết Đặt Vé</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Người đặt</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Tổng Số vé</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Tổng tiền</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Ngày đặt</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredBookings.length === 0 && (
                                <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                                    {searchTerm ? 'Không tìm thấy lượt đặt vé nào phù hợp.' : 'Chưa có lượt đặt vé nào.'}
                                </td></tr>
                            )}
                            {filteredBookings.map((booking) => (
                                <tr key={booking._id.toString()} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-4 whitespace-normal max-w-xs">
                                        {renderEventDetailsForAdmin(booking)}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900" title={booking.customerDetails?.fullName || 'N/A'}>
                                            {booking.customerDetails?.fullName || 'N/A'}
                                        </div>
                                        <div className="text-sm text-gray-500" title={booking.customerDetails?.email || 'N/A'}>
                                            {booking.customerDetails?.email || 'N/A'}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {booking.customerDetails?.phoneNumber || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-900">{booking.ticketCount}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">{formatCurrency(booking.totalPrice)}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateTime(booking.createdAt)}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-center">
                                        {renderStatusBadge(booking.status)} {/* Sẽ tự động render badge mới */}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-medium">
                                        <button
                                            onClick={() => handleOpenUpdateModal(booking)}
                                            className="text-indigo-600 hover:text-indigo-800 mr-3 transition-colors"
                                            title="Cập nhật trạng thái"
                                        >
                                            Sửa Status
                                        </button>
                                        <button
                                            onClick={() => handleDeleteBooking(booking._id.toString())}
                                            className="text-red-600 hover:text-red-800 transition-colors"
                                            title="Xóa đặt vé"
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && currentBooking && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center mb-4 border-b pb-3">
                            <h2 className="text-xl font-semibold text-gray-800">Cập nhật trạng thái đặt vé</h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 p-1 rounded-full transition-colors" aria-label="Đóng">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        {error && !isSubmitting && <p className="text-red-500 mb-3 text-sm p-2 bg-red-50 rounded-md">Lỗi: {error}</p>}
                        <TicketBookingStatusForm
                            booking={currentBooking}
                            onSubmit={handleSubmitStatusUpdate}
                            onCancel={handleCloseModal}
                            isSubmitting={isSubmitting}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}