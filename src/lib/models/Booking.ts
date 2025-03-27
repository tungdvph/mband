import mongoose, { Document } from 'mongoose';

interface IBooking extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  eventName: string;
  eventDate: Date;
  location: string;
  eventType: string;
  duration: number;
  expectedGuests: number;
  requirements: string;
  budget: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  eventName: { 
    type: String, 
    required: true 
  },
  eventDate: { 
    type: Date, 
    required: true 
  },
  location: { 
    type: String, 
    required: true 
  },
  eventType: { 
    type: String, 
    required: true 
  },
  duration: { 
    type: Number, 
    required: true 
  },
  expectedGuests: { 
    type: Number, 
    required: true 
  },
  requirements: { 
    type: String, 
    default: '' 
  },
  budget: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  contactName: { 
    type: String, 
    required: true 
  },
  contactPhone: { 
    type: String, 
    required: true 
  },
  contactEmail: { 
    type: String, 
    required: true 
  }
}, {
  versionKey: '__v',
  timestamps: true
});

// Xóa model cũ nếu tồn tại
if (mongoose.models.Booking) {
  delete mongoose.models.Booking;
}

// Tạo model mới
const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
export default Booking;