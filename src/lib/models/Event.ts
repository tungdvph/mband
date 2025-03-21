import mongoose from 'mongoose';

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
});

const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);
export default Event;