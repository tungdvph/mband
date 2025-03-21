import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true }, // vai trò trong band
  image: { type: String },
  description: { type: String },
  socialLinks: {
    facebook: String,
    instagram: String,
    twitter: String
  }
});

const Member = mongoose.models.Member || mongoose.model('Member', memberSchema);
export default Member;