// /app/admin/ticket-booking/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { TicketBooking, TicketBookingStatusUpdateData } from '@/types/ticketBooking'; // Import interface
import TicketBookingStatusForm from '@/components/admin/TicketBookingStatusForm'; // Import form

// Hàm format tiền tệ và ngày giờ
const formatCurrency = (value: number): string => {
    if (isNaN(value)) return 'N/A'; // Thêm kiểm tra NaN
    return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}
const formatDate = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date'; // Thêm kiểm tra ngày hợp lệ
        return date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
    } catch (e) { return 'Invalid Date'; }
}
const formatDateOnly = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date'; // Thêm kiểm tra ngày hợp lệ
        return date.toLocaleDateString('vi-VN');
    } catch (e) { return 'Invalid Date'; }
}


export default function TicketBookingManagement() {
    const [bookings, setBookings] = useState<TicketBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    // --- Modal Handlers ---
    const handleOpenUpdateModal = (booking: TicketBooking) => {
        setCurrentBooking(booking);
        setIsModalOpen(true);
        setError(null); // Xóa lỗi cũ khi mở modal
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentBooking(null);
        setIsSubmitting(false);
        setError(null); // Xóa lỗi khi đóng modal
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
        setError(null); // Xóa lỗi trước khi submit

        try {
            const response = await fetch(`/api/ticket-booking/${currentBooking._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                await fetchBookings(); // Fetch lại danh sách để cập nhật
                alert('Cập nhật trạng thái thành công!');
                handleCloseModal();
            } else {
                const errorData = await response.json().catch(() => ({}));
                // Hiển thị lỗi API ngay trong modal
                setError(errorData.error || 'Không thể cập nhật trạng thái');
                // throw new Error(errorData.error || 'Không thể cập nhật trạng thái'); // Không throw để không hiện alert
            }
        } catch (err) {
            // Hiển thị lỗi mạng hoặc lỗi khác trong modal
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            console.error("Error updating status:", err);
            // alert(`Lỗi khi cập nhật: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Render Status Badge ---
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


    // --- JSX ---
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Quản lý Đặt vé</h1>
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
                        <tbody className="bg-white divide-y divide-gray-200">
                            {bookings.length === 0 && !error && (
                                <tr><td colSpan={7} className="px-6 py-4 text-center text-gray-500">Chưa có lượt đặt vé nào.</td></tr>
                            )}
                            {bookings.map((booking) => (
                                <tr key={booking._id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{booking.scheduleId?.eventName || 'N/A'}</div>
                                        <div className="text-sm text-gray-500">{formatDateOnly(booking.scheduleId?.date)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {/* --- ĐÃ SỬA Ở ĐÂY --- */}
                                        <div className="text-sm font-medium text-gray-900">{booking.userId?.fullName || booking.userId?.email || 'N/A'}</div>
                                        <div className="text-sm text-gray-500">{booking.userId?.email || 'N/A'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{booking.ticketCount}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(booking.totalPrice)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(booking.createdAt)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {renderStatusBadge(booking.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium">
                                        <button
                                            onClick={() => handleOpenUpdateModal(booking)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-3" // Giảm margin
                                            title="Cập nhật trạng thái" // Thêm title
                                        >
                                            Sửa Status
                                        </button>
                                        <button
                                            onClick={() => handleDeleteBooking(booking._id)}
                                            className="text-red-600 hover:text-red-900"
                                            title="Xóa đặt vé" // Thêm title
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

            {/* --- Modal Cập nhật trạng thái --- */}
            {isModalOpen && currentBooking && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h2 className="text-xl font-bold">Cập nhật trạng thái</h2>
                            <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">&times;</button>
                        </div>
                        {/* Hiển thị lỗi API trong modal nếu có */}
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