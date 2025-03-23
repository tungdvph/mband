import mongoose from 'mongoose';

const musicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  artist: { type: String, required: true },
  image: { type: String },
  audio: { type: String, required: true },
  isPublished: { type: Boolean, default: false },
}, {
  timestamps: true // Tự động thêm createdAt và updatedAt
});

const Music = mongoose.models.Music || mongoose.model('Music', musicSchema);
export default Music;