import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true }, // vai trò trong band
  image: { type: String },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  socialLinks: {
    facebook: String,
    instagram: String,
    twitter: String
  }
}, {
  timestamps: true // Tự động thêm createdAt và updatedAt
});

const Member = mongoose.models.Member || mongoose.model('Member', memberSchema);
export default Member;