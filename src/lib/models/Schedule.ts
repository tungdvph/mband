// /lib/models/Schedule.ts (ĐÃ SỬA)

import mongoose, { Document, Schema, Model } from 'mongoose'; // Thêm Model vào import

// Interface cho địa điểm
interface IVenue {
  name: string;
  address: string;
  city: string;
}

// Interface cho Schedule (đã thêm price)
export interface ISchedule extends Document { // Nên export interface để dùng ở nơi khác nếu cần
  eventName: string;
  date: Date;
  startTime: string;
  endTime?: string;
  venue: IVenue;
  description?: string;
  type: 'concert' | 'rehearsal' | 'meeting' | 'interview' | 'other';
  status: 'scheduled' | 'completed' | 'cancelled';
  price: number; // <<< ĐÃ THÊM
  createdAt: Date;
  updatedAt: Date;
}

// Schema cho Schedule (đã thêm price)
const scheduleSchema: Schema<ISchedule> = new mongoose.Schema({ // Thêm kiểu dữ liệu cho Schema
  eventName: { type: String, required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String },
  venue: { // Venue là một sub-document
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
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'postponed'],
    default: 'scheduled'
  },
  price: { // <<< ĐÃ THÊM
    type: Number,
    required: [true, 'Ticket price is required'],
    min: [0, 'Price cannot be negative']
  }
}, {
  versionKey: '__v',
  timestamps: true // Tự động thêm createdAt và updatedAt
});

// Sử dụng cách export HMR-friendly được khuyến nghị hơn
const modelName = 'Schedule';
const Schedule: Model<ISchedule> = (mongoose.models[modelName] as Model<ISchedule>) ||
  mongoose.model<ISchedule>(modelName, scheduleSchema);


// // Cách export cũ của bạn (có thể hoạt động nhưng cách trên tốt hơn cho HMR)
// if (mongoose.models.Schedule) {
//  delete mongoose.models.Schedule;
// }
// const Schedule = mongoose.model<ISchedule>('Schedule', scheduleSchema);


export default Schedule;

// Export thêm interface nếu bạn muốn dùng nó ở nơi khác
// export type { ISchedule, IVenue };