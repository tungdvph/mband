import mongoose, { Document } from 'mongoose';

interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: 'user' | 'admin';
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  avatar: { type: String },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date }
}, {
  versionKey: '__v',
  timestamps: true
});

// Xóa model cũ nếu tồn tại
if (mongoose.models.User) {
  delete mongoose.models.User;
}

// Tạo model mới
const User = mongoose.model<IUser>('User', userSchema);
export default User;