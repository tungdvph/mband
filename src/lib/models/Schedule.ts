// /lib/models/Schedule.ts
import mongoose, { Document, Schema, Model, Types } from 'mongoose';

// Interface cho địa điểm
export interface IVenue { // Đảm bảo được export
  name: string;
  address: string;
  city: string;
}

// Interface cho Schedule
export interface ISchedule extends Document {
  _id: Types.ObjectId; // Định nghĩa _id tường minh
  eventName: string;
  date: Date; // Ngày tháng được lưu trữ dưới dạng Date trong MongoDB
  startTime: string;
  endTime?: string;
  venue: IVenue; // Sử dụng interface IVenue ở trên
  description?: string;
  type: 'concert' | 'rehearsal' | 'meeting' | 'interview' | 'other';
  status: 'scheduled' | 'completed' | 'cancelled' | 'postponed';
  price?: number;
  createdAt: Date; // Định nghĩa tường minh createdAt
  updatedAt: Date; // Định nghĩa tường minh updatedAt
}

// Schema cho Schedule
const scheduleSchema: Schema<ISchedule> = new mongoose.Schema({
  eventName: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String },
  venue: { // Sub-document nhúng
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true }
  },
  description: { type: String, trim: true },
  type: {
    type: String,
    enum: ['concert', 'rehearsal', 'meeting', 'interview', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'postponed'],
    default: 'scheduled',
    required: true
  },
  price: {
    type: Number,
    required: false,
    min: [0, 'Giá không thể âm'],
    default: null // Hoặc 0 nếu muốn giá mặc định là 0 khi không cung cấp
  }
}, {
  versionKey: false, // Bỏ versionKey (__v) nếu không cần thiết
  timestamps: true   // Tự động thêm createdAt và updatedAt (kiểu Date)
});

// Index để tối ưu truy vấn (tùy chọn)
scheduleSchema.index({ date: 1, status: 1 });
scheduleSchema.index({ eventName: 'text', 'venue.name': 'text' }); // Text index cho tìm kiếm

const modelName = 'Schedule';
// Đảm bảo model được định nghĩa đúng cách, HMR-friendly
const Schedule: Model<ISchedule> = mongoose.models[modelName] ||
  mongoose.model<ISchedule>(modelName, scheduleSchema);

export default Schedule;
