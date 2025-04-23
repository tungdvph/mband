import mongoose, { Document, Model } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: 'user' | 'admin';
  avatar?: string;
  isActive: boolean;
}

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    select: true  // Đổi thành true để có thể query password
  },
  fullName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  avatar: {
    type: String,
    default: '/default-avatar.png'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

let User: Model<IUser>;

try {
  // Try to get existing model
  User = mongoose.model<IUser>('User');
} catch {
  // Create new model if it doesn't exist
  User = mongoose.model<IUser>('User', userSchema);
}

export default User;