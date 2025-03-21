import mongoose from 'mongoose';

const musicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  album: { type: String },
  releaseDate: { type: Date },
  duration: { type: Number }, // thời lượng bài hát (giây)
  audioUrl: { type: String, required: true },
  coverImage: { type: String },
  genre: [String]
});

const Music = mongoose.models.Music || mongoose.model('Music', musicSchema);
export default Music;