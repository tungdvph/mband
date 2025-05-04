// /app/admin/ticket-booking/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react'; // <<< THÊM useMemo
import { TicketBooking, TicketBookingStatusUpdateData } from '@/types/ticketBooking';
import TicketBookingStatusForm from '@/components/admin/TicketBookingStatusForm';

// --- START: Đặt các hàm helper lên đầu ---
// Hàm format tiền tệ và ngày giờ
const formatCurrency = (value: number): string => {
    if (isNaN(value)) return 'N/A';
    return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}
const formatDate = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
    } catch (e) { return 'Invalid Date'; }
}
const formatDateOnly = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString('vi-VN');
    } catch (e) { return 'Invalid Date'; }
}

// <<< THÊM: Hàm lấy text trạng thái để tìm kiếm >>>
const formatBookingStatusText = (status: 'pending' | 'confirmed' | 'cancelled'): string => {
    switch (status) {
        case 'confirmed': return 'Đã xác nhận';
        case 'cancelled': return 'Đã hủy';
        case 'pending':
        default: return 'Chờ xác nhận';
    }
};

// --- Render Status Badge ---
// Đặt hàm này trước useMemo luôn cho nhất quán
const renderStatusBadge = (status: 'pending' | 'confirmed' | 'cancelled') => {
    let bgColor, textColor, text;
    switch (status) {
        case 'confirmed':
            bgColor = 'bg-green-100'; textColor = 'text-green-800'; text = 'Đã xác nhận'; break;
        case 'cancelled':
            bgColor = 'bg-red-100'; textColor = 'text-red-800'; text = 'Đã hủy'; break;
        case 'pending':
        default:
            bgColor = 'bg-yellow-100'; textColor = 'text-yellow-800'; text = 'Chờ xác nhận'; break;
    }
    return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>{text}</span>;
};
// --- END: Đặt các hàm helper lên đầu ---


export default function TicketBookingManagement() {
    const [bookings, setBookings] = useState<TicketBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState(''); // <<< THÊM: State tìm kiếm
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentBooking, setCurrentBooking] = useState<TicketBooking | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Fetch Data ---
    const fetchBookings = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/ticket-booking');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Failed to fetch ticket bookings' }));
                throw new Error(errorData.error || 'Failed to fetch ticket bookings');
            }
            const data = await response.json();
            setBookings(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            console.error("Error fetching bookings:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    // <<< THÊM: Lọc danh sách đặt vé bằng useMemo >>>
    const filteredBookings = useMemo(() => {
        if (!searchTerm) {
            return bookings;
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return bookings.filter(booking =>
            // Kiểm tra null/undefined bằng optional chaining (?.) và fallback về chuỗi rỗng ('')
            (booking.scheduleId?.eventName?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
            (booking.userId?.fullName?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
            (booking.userId?.email?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
            formatBookingStatusText(booking.status).toLowerCase().includes(lowerCaseSearchTerm) // Tìm theo text trạng thái
        );
    }, [bookings, searchTerm]);

    // --- Modal Handlers ---
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

    // --- Delete Handler ---
    const handleDeleteBooking = async (bookingId: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa lượt đặt vé này? Hành động này không thể hoàn tác.')) {
            try {
                const response = await fetch(`/api/ticket-booking/${bookingId}`, { method: 'DELETE' });
                if (response.ok) {
                    setBookings(prev => prev.filter(b => b._id !== bookingId));
                    alert('Xóa đặt vé thành công!');
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Không thể xóa đặt vé');
                }
            } catch (err) {
                alert(`Lỗi khi xóa: ${err instanceof Error ? err.message : 'Unknown error'}`);
                console.error("Error deleting booking:", err);
            }
        }
    };

    // --- Submit Status Update Handler ---
    const handleSubmitStatusUpdate = async (data: TicketBookingStatusUpdateData) => {
        if (!currentBooking) return;
        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch(`/api/ticket-booking/${currentBooking._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                await fetchBookings();
                alert('Cập nhật trạng thái thành công!');
                handleCloseModal();
            } else {
                const errorData = await response.json().catch(() => ({}));
                setError(errorData.error || 'Không thể cập nhật trạng thái');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            console.error("Error updating status:", err);
        } finally {
            setIsSubmitting(false);
        }
    };


    // --- JSX ---
    return (
        <div className="p-6"> {/* Thêm padding bao ngoài */}
            {/* <<< CẬP NHẬT: Header với ô tìm kiếm */}
            <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
                <h1 className="text-2xl font-bold">Quản lý Đặt vé</h1>
                {/* Search Input */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm sự kiện, người đặt, email, status..." // Cập nhật placeholder
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
            </div>

            {loading && <p className="text-center py-4">Đang tải dữ liệu...</p>}
            {!loading && error && !isModalOpen && <p className="text-red-500 text-center py-4">Lỗi tải dữ liệu: {error}</p>}

            {!loading && (
                <div className="bg-white rounded-lg shadow overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sự kiện</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người đặt</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Số vé</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng tiền</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày đặt</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                            </tr>
                        </thead>
                        {/* <<< CẬP NHẬT: Sử dụng filteredBookings */}
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredBookings.length === 0 && !error && (
                                <tr><td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                                    {/* <<< CẬP NHẬT: Thông báo khi không có kết quả */}
                                    {searchTerm ? 'Không tìm thấy lượt đặt vé nào phù hợp.' : 'Chưa có lượt đặt vé nào.'}
                                </td></tr>
                            )}
                            {/* <<< CẬP NHẬT: Map qua filteredBookings */}
                            {filteredBookings.map((booking) => (
                                <tr key={booking._id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{booking.scheduleId?.eventName || 'N/A'}</div>
                                        <div className="text-sm text-gray-500">{formatDateOnly(booking.scheduleId?.date)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{booking.userId?.fullName || booking.userId?.email || 'N/A'}</div>
                                        <div className="text-sm text-gray-500">{booking.userId?.email || 'N/A'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{booking.ticketCount}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(booking.totalPrice)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(booking.createdAt)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {renderStatusBadge(booking.status)} {/* Gọi hàm render */}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium">
                                        <button
                                            onClick={() => handleOpenUpdateModal(booking)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                                            title="Cập nhật trạng thái"
                                        >
                                            Sửa Status
                                        </button>
                                        <button
                                            onClick={() => handleDeleteBooking(booking._id)}
                                            className="text-red-600 hover:text-red-900"
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

            {/* --- Modal Cập nhật trạng thái (Không đổi) --- */}
            {isModalOpen && currentBooking && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h2 className="text-xl font-bold">Cập nhật trạng thái</h2>
                            <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">&times;</button>
                        </div>
                        {error && !isSubmitting && <p className="text-red-500 mb-4 text-sm">Lỗi: {error}</p>}
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