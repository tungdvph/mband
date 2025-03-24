import mongoose, { Document } from 'mongoose';

interface IVenue {
  name: string;
  address: string;
  city: string;
}

interface ISchedule extends Document {
  eventName: string;
  date: Date;
  startTime: string;
  endTime?: string;
  venue: IVenue;
  description?: string;
  type: 'concert' | 'rehearsal' | 'meeting' | 'interview' | 'other';
  status: 'scheduled' | 'completed' | 'cancelled';
}

const scheduleSchema = new mongoose.Schema({
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
  status: { 
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled'
  }
}, {
  timestamps: true
});

const Schedule = mongoose.models.Schedule || mongoose.model<ISchedule>('Schedule', scheduleSchema);
export default Schedule;