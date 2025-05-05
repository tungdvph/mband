// src/lib/models/User.ts
import mongoose, { Document, Model, Schema } from 'mongoose';

// Định nghĩa Interface cho User Document, bao gồm các trường mới
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  email: string;
  password: string; // Trường password sẽ được trả về nếu query có select('+password')
  fullName: string;
  role: 'user' | 'admin';
  avatar?: string;
  isActive: boolean;
  resetPasswordToken?: string; // Token để reset password (tùy chọn)
  resetPasswordExpires?: Date; // Thời gian token hết hạn (tùy chọn)
  createdAt: Date; // Tự động tạo bởi timestamps
  updatedAt: Date; // Tự động tạo bởi timestamps
}

// Định nghĩa Schema cho User
const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: [true, 'Tên đăng nhập là bắt buộc.'],
    unique: true,
    trim: true, // Tự động xóa khoảng trắng đầu/cuối
    // Thêm index để tối ưu tìm kiếm không phân biệt hoa thường (case-insensitive)
    // Lưu ý: Đảm bảo collation được hỗ trợ bởi MongoDB server của bạn
    index: { unique: true, collation: { locale: 'en', strength: 2 } }
  },
  email: {
    type: String,
    required: [true, 'Email là bắt buộc.'],
    unique: true,
    trim: true,
    lowercase: true, // Luôn lưu email dạng chữ thường
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Vui lòng nhập định dạng email hợp lệ.'], // Regex validation cơ bản
    // Thêm index để tối ưu tìm kiếm
    index: { unique: true }
  },
  password: {
    type: String,
    required: [true, 'Mật khẩu là bắt buộc.'],
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự.'],
    select: false // Quan trọng: Không trả về mật khẩu trong các query thông thường
    // Chỉ trả về khi dùng .select('+password')
  },
  fullName: {
    type: String,
    required: [true, 'Họ và tên là bắt buộc.'],
    trim: true
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'admin'],
      message: 'Vai trò không hợp lệ.'
    },
    default: 'user'
  },
  avatar: {
    type: String,
    default: '/default-avatar.png' // Đường dẫn đến avatar mặc định
  },
  isActive: {
    type: Boolean,
    default: true // Mặc định tài khoản là active
  },
  // Thêm các trường mới cho tính năng quên mật khẩu
  resetPasswordToken: {
    type: String,
    select: false // Không trả về token khi query user thông thường
  },
  resetPasswordExpires: {
    type: Date,
    select: false // Không trả về thời gian hết hạn khi query user thông thường
  }
}, {
  // Tự động thêm createdAt và updatedAt
  timestamps: true
});


// --- Logic để tránh lỗi OverwriteModelError trong Next.js HMR ---
// Kiểm tra xem model 'User' đã được định nghĩa chưa
let User: Model<IUser>;

if (mongoose.models.User) {
  // Nếu đã có, sử dụng model hiện có
  User = mongoose.model<IUser>('User');
} else {
  // Nếu chưa có, tạo model mới
  User = mongoose.model<IUser>('User', userSchema);
}

export default User;