import mongoose from 'mongoose';

const bandSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  foundedYear: { type: Number },
  genre: [String],
  logo: { type: String },
  coverImage: { type: String },
  socialLinks: {
    facebook: String,
    instagram: String,
    twitter: String,
    youtube: String
  },
  contactEmail: { type: String },
  contactPhone: { type: String }
});

const Band = mongoose.models.Band || mongoose.model('Band', bandSchema);
export default Band;