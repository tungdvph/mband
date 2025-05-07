// /lib/models/Schedule.ts 

import mongoose, { Document, Schema, Model } from 'mongoose';

// Interface cho địa điểm (giữ nguyên)
interface IVenue {
  name: string;
  address: string;
  city: string;
}

// Interface cho Schedule (đã thêm price)
export interface ISchedule extends Document {
  eventName: string;
  date: Date;
  startTime: string;
  endTime?: string;
  venue: IVenue;
  description?: string;
  type: 'concert' | 'rehearsal' | 'meeting' | 'interview' | 'other';
  // *** SỬA Ở ĐÂY: Thêm 'postponed' vào kiểu dữ liệu status ***
  status: 'scheduled' | 'completed' | 'cancelled' | 'postponed';
  price?: number; // Sửa lại thành optional (?) để khớp với schema (required: false)
  createdAt: Date;
  updatedAt: Date;
}

// Schema cho Schedule (đã thêm price)
const scheduleSchema: Schema<ISchedule> = new mongoose.Schema({
  eventName: { type: String, required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String },
  venue: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true }
  },
  description: { type: String },
  type: {
    type: String,
    enum: ['concert', 'rehearsal', 'meeting', 'interview', 'other'],
    required: true
  },
  status: { // Enum trong schema đã đúng (có 'postponed')
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'postponed'],
    default: 'scheduled',
    required: true // Thêm required: true nếu status luôn phải có giá trị
  },
  price: { // price là optional trong schema
    type: Number,
    required: false, // Không bắt buộc
    min: [0, 'Price cannot be negative'],
    default: null // Hoặc 0 nếu muốn giá mặc định là 0
  }
}, {
  // versionKey: '__v', // Có thể bỏ nếu không dùng version key
  versionKey: false,
  timestamps: true // Tự động thêm createdAt và updatedAt
});

// Sử dụng cách export HMR-friendly được khuyến nghị hơn
const modelName = 'Schedule';
const Schedule: Model<ISchedule> = (mongoose.models[modelName] as Model<ISchedule>) ||
  mongoose.model<ISchedule>(modelName, scheduleSchema);

export default Schedule;

// Export thêm interface nếu bạn muốn dùng nó ở nơi khác
// export type { IVenue }; // Chỉ export IVenue nếu cần