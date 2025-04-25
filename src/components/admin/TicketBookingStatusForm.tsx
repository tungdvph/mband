// /components/admin/TicketBookingStatusForm.tsx
'use client';
import { useState, useEffect } from 'react';
import { TicketBooking, TicketBookingStatusUpdateData } from '@/types/ticketBooking';

interface TicketBookingStatusFormProps {
    booking: TicketBooking; // Booking hiện tại để hiển thị thông tin
    onSubmit: (data: TicketBookingStatusUpdateData) => void;
    onCancel: () => void;
    isSubmitting: boolean; // Thêm prop để disable nút khi đang gửi
}

export default function TicketBookingStatusForm({ booking, onSubmit, onCancel, isSubmitting }: TicketBookingStatusFormProps) {
    const [status, setStatus] = useState<'pending' | 'confirmed' | 'cancelled'>(booking.status);

    // Cập nhật status nếu booking prop thay đổi
    useEffect(() => {
        setStatus(booking.status);
    }, [booking]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Chỉ submit nếu status thực sự thay đổi để tránh gọi API thừa
        // Hoặc bỏ qua kiểm tra này nếu muốn luôn cho phép submit
        // if (status !== booking.status) {
        onSubmit({ status });
        // } else {
        //     console.log("Status hasn't changed.");
        // }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Hiển thị một số thông tin booking để xác nhận */}
            <div className='mb-4 border-b pb-4 text-sm text-gray-600 space-y-1'>
                <p><strong>ID Đặt vé:</strong> {booking._id}</p>
                <p><strong>Sự kiện:</strong> {booking.scheduleId?.eventName || 'N/A'}</p>
                {/* --- ĐÃ SỬA Ở ĐÂY --- */}
                <p><strong>Người đặt:</strong> {booking.userId?.fullName || booking.userId?.email || 'N/A'}</p>
                <p><strong>Email:</strong> {booking.userId?.email || 'N/A'}</p>
                <p><strong>Số vé:</strong> {booking.ticketCount}</p>
                {/* Có thể thêm thông tin khác nếu cần */}
            </div>

            <div>
                <label htmlFor="booking-status" className="block text-sm font-medium text-gray-700">
                    Cập nhật trạng thái
                </label>
                <select
                    id="booking-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'pending' | 'confirmed' | 'cancelled')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    disabled={isSubmitting}
                >
                    <option value="pending">Chờ xác nhận</option>
                    <option value="confirmed">Đã xác nhận</option>
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
                    disabled={isSubmitting || status === booking.status} // Disable nếu đang gửi hoặc status không đổi
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
            </div>
        </form>
    );
}