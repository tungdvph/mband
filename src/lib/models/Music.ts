import mongoose, { Document } from 'mongoose';

interface IMusic extends Document {
  title: string;
  description?: string;
  artist: string;
  image?: string;
  audio: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const musicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  artist: { type: String, required: true },
  image: { type: String },
  audio: { type: String, required: true },
  isPublished: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  versionKey: '__v',
  timestamps: true
});

// Xóa model cũ nếu tồn tại
if (mongoose.models.Music) {
  delete mongoose.models.Music;
}

const Music = mongoose.model<IMusic>('Music', musicSchema);
export default Music;