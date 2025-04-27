// /lib/models/News.ts
import mongoose, { Document } from 'mongoose';

// === THÊM "export" VÀO ĐÂY ===
export interface INews extends Document {
  title: string;
  content: string;
  image?: string;
  author: string;
  category?: 'announcement' | 'event' | 'release' | 'interview' | 'other';
  tags?: string[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String },
  author: { type: String, required: true }, // Giữ nguyên kiểu String nếu bạn đã quyết định
  category: {
    type: String,
    enum: ['announcement', 'event', 'release', 'interview', 'other']
  },
  tags: [String],
  isPublished: { type: Boolean, default: true },
  // createdAt và updatedAt sẽ được tự động quản lý bởi timestamps: true
}, {
  versionKey: '__v',
  timestamps: true // Sử dụng timestamps của Mongoose
});

// Không cần xóa model nếu dùng cách kiểm tra này
const News = mongoose.models.News || mongoose.model<INews>('News', newsSchema);

export default News; // Giữ nguyên export default cho model