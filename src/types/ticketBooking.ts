// /types/ticketBooking.ts
import { Types } from 'mongoose'; // Import Types để sử dụng ObjectId nếu cần thiết ở frontend
import { Schedule } from './schedule'; // Đảm bảo import Schedule đúng
import { User } from './user';       // Đảm bảo import User đúng

// Interface cho một mục chi tiết trong bookedItems (cho combo)
// Sử dụng string cho _id và scheduleId vì thường khi populate hoặc gửi về client, ObjectId sẽ là string
export interface BookedItemDetailClient {
    scheduleId: string; // ID của Schedule
    eventName: string;
    date?: Date | string; // Ngày diễn ra sự kiện
    ticketCount: number;
    priceAtBooking: number; // Giá mỗi vé của sự kiện này tại thời điểm đặt
    _id?: string;         // ID của sub-document này (nếu có)
}

// Interface chính cho TicketBooking ở phía client
// Sẽ phản ánh ITicketBooking từ model, nhưng với các kiểu dữ liệu phù hợp cho client
export interface TicketBooking {
    _id: string; // Hoặc Types.ObjectId nếu bạn dùng trực tiếp ở client

    userId?: Pick<User, '_id' | 'fullName' | 'email'> | null; // User có thể được populate hoặc chỉ là ID, hoặc null

    customerDetails: {
        fullName: string;
        email: string;
        phoneNumber: string;
        notes?: string;
    };

    // scheduleId có thể là một object Schedule được populate (cho single booking) hoặc null (cho combo)
    scheduleId?: Pick<Schedule, '_id' | 'eventName' | 'date' | 'price'> | null;
    // Thêm 'price' vào Pick nếu bạn muốn hiển thị giá gốc của schedule đơn lẻ

    bookingType: 'single' | 'combo';
    bookedItems: BookedItemDetailClient[]; // Luôn là một mảng

    ticketCount: number;        // Tổng số vé
    totalPrice: number;         // Tổng tiền cuối cùng (sau khuyến mãi)
    priceBeforeDiscount?: number; // Tổng tiền trước khuyến mãi
    appliedPromotion?: {
        description: string;
        discountPercentage: number;
    } | null;
    status: 'pending' | 'confirmed' | 'cancelled';
    paymentDetails?: {
        paymentMethod?: string;
        transactionId?: string;
        paidAt?: Date | string;
    };
    createdAt: Date | string; // Thường là string khi nhận từ API JSON
    updatedAt: Date | string; // Thường là string khi nhận từ API JSON
}

// Interface cho form cập nhật trạng thái (giữ nguyên)
export interface TicketBookingStatusUpdateData {
    status: 'pending' | 'confirmed' | 'cancelled';
}
