// /lib/models/TicketBooking.ts
import mongoose, { Document, Schema, Types, Model } from 'mongoose'; // Thêm Model

// Interface định nghĩa cấu trúc Document cho TicketBooking trong DB
export interface ITicketBooking extends Document {
    scheduleId: Types.ObjectId; // Tham chiếu đến Schedule
    userId: Types.ObjectId;     // Tham chiếu đến User
    ticketCount: number;
    totalPrice: number;
    status: 'pending' | 'confirmed' | 'cancelled';
    seatInfo?: string;

    // *** THÊM: Khai báo rõ ràng các trường timestamps ***
    // Mặc dù Mongoose quản lý chúng, khai báo ở đây giúp TypeScript nhận biết
    // và tương thích với các kiểu dữ liệu khác (như PopulatedBooking)
    createdAt: Date;
    updatedAt: Date;
}

// Định nghĩa Mongoose Schema
const ticketBookingSchema = new Schema<ITicketBooking>({
    scheduleId: { type: Schema.Types.ObjectId, ref: 'Schedule', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ticketCount: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true, min: 0 }, // Đảm bảo totalPrice được lưu khi tạo booking
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'pending',
    },
    seatInfo: { type: String },
    // Không cần khai báo createdAt, updatedAt ở đây vì đã có timestamps: true
}, {
    timestamps: true, // Tự động thêm createdAt, updatedAt
    versionKey: '__v',
});

// Index để tăng tốc độ truy vấn (tùy chọn)
ticketBookingSchema.index({ scheduleId: 1 });
ticketBookingSchema.index({ userId: 1 });
ticketBookingSchema.index({ status: 1 });

// Export Mongoose model
const modelName = 'TicketBooking';
// Sử dụng assertion 'as Model<ITicketBooking>' để rõ ràng hơn
const TicketBooking = (mongoose.models[modelName] as Model<ITicketBooking>) ||
    mongoose.model<ITicketBooking>(modelName, ticketBookingSchema);

export default TicketBooking;