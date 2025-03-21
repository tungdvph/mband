import mongoose from 'mongoose';

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
});

const Schedule = mongoose.models.Schedule || mongoose.model('Schedule', scheduleSchema);
export default Schedule;