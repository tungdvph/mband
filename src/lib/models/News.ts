import mongoose, { Document } from 'mongoose';

interface INews extends Document {
  title: string;
  content: string;
  image?: string;
  author: string;  // Thay đổi từ ObjectId sang string
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
  author: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['announcement', 'event', 'release', 'interview', 'other']
  },
  tags: [String],
  isPublished: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  // Thêm version key
  versionKey: '__v',
  // Tự động tạo timestamps
  timestamps: true
});

// Xóa model cũ nếu tồn tại
if (mongoose.models.News) {
  delete mongoose.models.News;
}

// Tạo model mới
const News = mongoose.model<INews>('News', newsSchema);
export default News;