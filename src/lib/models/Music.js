import mongoose from 'mongoose';

const musicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  album: { type: String },
  duration: { type: Number, required: true }, // in seconds
  releaseDate: { type: Date },
  genre: [String],
  audioUrl: { type: String, required: true },
  coverImage: { type: String },
  lyrics: { type: String },
  composers: [String],
  arrangers: [String],
  isPublished: { type: Boolean, default: true },
  streams: { type: Number, default: 0 }
});

const Music = mongoose.models.Music || mongoose.model('Music', musicSchema);
export default Music;