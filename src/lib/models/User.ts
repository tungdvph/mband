import mongoose, { Document, Model } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  name: string;
  role: 'user' | 'admin';
  avatar?: string;
}

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  name: { 
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