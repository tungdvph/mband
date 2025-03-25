import mongoose, { Document } from 'mongoose';

interface IContact extends Document {
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'pending' | 'responded' | 'closed';
  createdAt: Date;
  updatedAt: Date;
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
  }
}, {
  versionKey: '__v',
  timestamps: true
});

// Xóa model cũ nếu tồn tại
if (mongoose.models.Contact) {
  delete mongoose.models.Contact;
}

// Tạo model mới
const Contact = mongoose.model<IContact>('Contact', contactSchema);
export default Contact;