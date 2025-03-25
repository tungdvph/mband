import mongoose, { Document } from 'mongoose';

interface IEvent extends Document {
  title: string;
  date: Date;
  location: string;
  description?: string;
  price: number;
  availableTickets: number;
  image?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  availableTickets: { type: Number, required: true },
  image: { type: String },
  status: { 
    type: String, 
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  }
}, {
  versionKey: '__v',
  timestamps: true
});

// Xóa model cũ nếu tồn tại
if (mongoose.models.Event) {
  delete mongoose.models.Event;
}

// Tạo model mới
const Event = mongoose.model<IEvent>('Event', eventSchema);
export default Event;