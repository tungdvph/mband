// /lib/models/Booking.js
import mongoose, { Document, Schema, Types } from 'mongoose';

// Interface cho TypeScript (tương tự như trong booking.ts nhưng đặt ở đây cho tiện tham chiếu)
export interface IBooking extends Document {
  // userId?: Types.ObjectId; // Có thể thêm nếu cần liên kết với user
  eventName: string;
  eventDate: Date;
  location: string;
  eventType: 'wedding' | 'birthday' | 'corporate' | 'festival' | 'other';
  duration: number; // Giờ
  expectedGuests: number;
  requirements?: string;
  budget?: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>({
  // userId: { type: Schema.Types.ObjectId, ref: 'User' }, // Ví dụ nếu cần liên kết User
  eventName: { type: String, required: true },
  eventDate: { type: Date, required: true },
  location: { type: String, required: true },
  eventType: {
    type: String,
    enum: ['wedding', 'birthday', 'corporate', 'festival', 'other'],
    required: true,
  },
  duration: { type: Number, required: true, min: 1 },
  expectedGuests: { type: Number, required: true, min: 1 },
  requirements: { type: String },
  budget: { type: Number, min: 0 },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending',
  },
  contactName: { type: String, required: true },
  contactPhone: { type: String, required: true },
  contactEmail: { type: String, required: true },
}, {
  timestamps: true, // Tự động thêm createdAt và updatedAt
  versionKey: '__v',
});

// Xóa model cũ nếu tồn tại để tránh lỗi HMR (Hot Module Replacement) trong Next.js dev
if (mongoose.models.Booking) {
  delete mongoose.models.Booking;
}

const Booking = mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;