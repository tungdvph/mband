// /types/booking.ts (hoặc tên file tương ứng)
export interface IBooking {
    _id: string; // Do Mongoose tự tạo
    // userId?: string; // ID của user nếu có liên kết
    eventName: string;
    eventDate: Date | string; // Dùng string khi lấy từ input, Date khi lưu/nhận từ DB
    location: string;
    eventType: 'wedding' | 'birthday' | 'corporate' | 'festival' | 'other';
    duration: number;
    expectedGuests: number;
    requirements?: string;
    budget?: number;
    status: 'pending' | 'confirmed' | 'cancelled';
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    createdAt: Date | string;
    updatedAt: Date | string;
}