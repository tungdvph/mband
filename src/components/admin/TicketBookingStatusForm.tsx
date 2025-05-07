'use client';
import { useState, useEffect } from 'react';
// Đảm bảo import TicketBooking và TicketBookingStatusUpdateData đã được cập nhật với 'delivered'
import { TicketBooking, TicketBookingStatusUpdateData } from '@/types/ticketBooking';

interface TicketBookingStatusFormProps {
    booking: TicketBooking;
    onSubmit: (data: TicketBookingStatusUpdateData) => void;
    onCancel: () => void;
    isSubmitting: boolean;
}

// Cập nhật kiểu cho status state
type BookingStatusType = 'pending' | 'confirmed' | 'cancelled' | 'delivered';

export default function TicketBookingStatusForm({ booking, onSubmit, onCancel, isSubmitting }: TicketBookingStatusFormProps) {
    const [status, setStatus] = useState<BookingStatusType>(booking.status);

    useEffect(() => {
        setStatus(booking.status);
    }, [booking]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ status });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className='mb-4 border-b pb-4 text-sm text-gray-600 space-y-1'>
                <p><strong>ID Đặt vé:</strong> {booking._id}</p>
                {/* Sửa lại để hiển thị tên sự kiện chính xác hơn cho cả single và combo */}
                <p><strong>Sự kiện:</strong> {
                    booking.bookingType === 'single' && booking.scheduleId?.eventName ? booking.scheduleId.eventName :
                        booking.bookingType === 'combo' && booking.bookedItems.length > 0 ? `Combo: ${booking.bookedItems[0].eventName}${booking.bookedItems.length > 1 ? ` và ${booking.bookedItems.length - 1} khác` : ''}` :
                            'N/A'
                }</p>
                <p><strong>Người đặt:</strong> {booking.customerDetails?.fullName || 'N/A'}</p>
                <p><strong>Email:</strong> {booking.customerDetails?.email || 'N/A'}</p>
                <p><strong>Số vé:</strong> {booking.ticketCount}</p>
            </div>

            <div>
                <label htmlFor="booking-status" className="block text-sm font-medium text-gray-700">
                    Cập nhật trạng thái
                </label>
                <select
                    id="booking-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as BookingStatusType)} // Cập nhật cast type
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    disabled={isSubmitting}
                >
                    <option value="pending">Chờ xác nhận</option>
                    <option value="confirmed">Đã xác nhận</option>
                    <option value="delivered">Đã giao</option> {/* <--- THÊM OPTION MỚI */}
                    <option value="cancelled">Đã hủy</option>
                </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    Hủy
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting || status === booking.status}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
            </div>
        </form>
    );
}