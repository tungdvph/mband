import mongoose, { Document } from 'mongoose';

interface IMember extends Document {
  name: string;
  role: string;
  image?: string;
  description?: string;
  isActive: boolean;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  image: { type: String },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  socialLinks: {
    facebook: String,
    instagram: String,
    twitter: String
  }
}, {
  versionKey: '__v',
  timestamps: true
});

// Xóa model cũ nếu tồn tại
if (mongoose.models.Member) {
  delete mongoose.models.Member;
}

// Tạo model mới
const Member = mongoose.model<IMember>('Member', memberSchema);
export default Member;