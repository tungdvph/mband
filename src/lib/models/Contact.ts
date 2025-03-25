import mongoose, { Document } from 'mongoose';

interface IContact extends Document {
  name: string;
  email: string;
  phone?: string;  // Thêm phone field
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';  // Sửa lại enum status
  createdAt: Date;
  updatedAt: Date;
}

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },  // Thêm phone field
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['new', 'read', 'replied'],  // Sửa lại enum status
    default: 'new'
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