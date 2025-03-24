import mongoose, { Document } from 'mongoose';

interface IContact extends Document {
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'pending' | 'responded' | 'closed';
  createdAt: Date;
}

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'responded', 'closed'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

const Contact = mongoose.models.Contact || mongoose.model<IContact>('Contact', contactSchema);
export default Contact;