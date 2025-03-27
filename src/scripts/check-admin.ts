import { connect, Schema, model } from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Định nghĩa Schema cho User
const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  isActive: { type: Boolean, default: true },
  avatar: { type: String, default: '/default-avatar.png' }
});

// Tạo model (đặt tên là 'users' để match với collection trong database)
const UserModel = model('users', UserSchema);

async function checkAdmin() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI không được định nghĩa trong biến môi trường');
    }
    
    await connect(process.env.MONGODB_URI);
    const admin = await UserModel.findOne({ username: 'admin' });
    
    if (admin) {
      console.log('Thông tin tài khoản admin:');
      console.log('- Username:', admin.username);
      console.log('- Email:', admin.email);
      console.log('- Role:', admin.role);
      console.log('- Trạng thái:', admin.isActive ? 'Đang hoạt động' : 'Đã khóa');
    } else {
      console.log('Chưa có tài khoản admin trong database!');
    }
  } catch (error) {
    console.error('Lỗi khi kiểm tra:', error);
  } finally {
    process.exit();
  }
}

checkAdmin();