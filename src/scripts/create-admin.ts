import { connect, Schema, model } from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  isActive: { type: Boolean, default: true },
  avatar: { type: String, default: '/default-avatar.png' }
}, {
  timestamps: true
});

const User = model('User', UserSchema);

async function createDefaultAdmin() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI không được định nghĩa trong biến môi trường');
    }

    await connect(process.env.MONGODB_URI);
    
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Tài khoản admin đã tồn tại');
      return;
    }

    const hashedPassword = await bcrypt.hash('123456', 12);
    const adminUser = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      fullName: 'Administrator',
      role: 'admin',
      isActive: true,
      avatar: '/default-avatar.png'
    });

    await adminUser.save();
    console.log('Đã tạo tài khoản admin thành công');
  } catch (error) {
    console.error('Lỗi khi tạo admin:', error);
  } finally {
    process.exit();
  }
}

createDefaultAdmin();