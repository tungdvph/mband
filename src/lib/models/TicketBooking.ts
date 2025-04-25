// /lib/models/TicketBooking.ts
import mongoose, { Document, Schema, Types } from 'mongoose';

// Interface định nghĩa cấu trúc Document cho TicketBooking trong DB
// Chỉ chứa các kiểu dữ liệu cơ bản và ObjectId tham chiếu
export interface ITicketBooking extends Document {
    scheduleId: Types.ObjectId; // Tham chiếu đến Schedule
    userId: Types.ObjectId;     // Tham chiếu đến User
    ticketCount: number;
    totalPrice: number;
    status: 'pending' | 'confirmed' | 'cancelled';
    seatInfo?: string;
    // createdAt và updatedAt sẽ được Mongoose tự động quản lý qua timestamps: true
}

// Định nghĩa Mongoose Schema
const ticketBookingSchema = new Schema<ITicketBooking>({
    scheduleId: { type: Schema.Types.ObjectId, ref: 'Schedule', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ticketCount: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true, min: 0 },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'pending',
    },
    seatInfo: { type: String },
}, {
    timestamps: true, // Tự động thêm createdAt, updatedAt
    versionKey: '__v',
});

// Index để tăng tốc độ truy vấn (tùy chọn)
ticketBookingSchema.index({ scheduleId: 1 });
ticketBookingSchema.index({ userId: 1 });
ticketBookingSchema.index({ status: 1 });

// Export Mongoose model
// Sử dụng cách kiểm tra models[modelName] để tương thích tốt hơn với HMR trong Next.js
const modelName = 'TicketBooking';
const TicketBooking = (mongoose.models[modelName] as mongoose.Model<ITicketBooking>) ||
    mongoose.model<ITicketBooking>(modelName, ticketBookingSchema);

export default TicketBooking;