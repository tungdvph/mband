// /types/ticketBooking.ts
import { Schedule } from './schedule'; // Đảm bảo import Schedule đúng
import { User } from './user';       // Đảm bảo import User đúng

export interface TicketBooking {
    _id: string;
    // Dữ liệu được populate từ tham chiếu
    scheduleId: Pick<Schedule, '_id' | 'eventName' | 'date'>;
    // --- ĐÃ SỬA Ở ĐÂY ---
    userId: Pick<User, '_id' | 'fullName' | 'email'>; // Lấy _id, fullName, email từ User
    ticketCount: number;
    totalPrice: number;
    status: 'pending' | 'confirmed' | 'cancelled';
    seatInfo?: string;
    createdAt: Date | string;
    updatedAt: Date | string;
}

// Interface cho form cập nhật trạng thái
export interface TicketBookingStatusUpdateData {
    status: 'pending' | 'confirmed' | 'cancelled';
}