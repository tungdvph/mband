import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String },
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  category: { 
    type: String, 
    enum: ['announcement', 'event', 'release', 'interview', 'other']
  },
  tags: [String],
  publishDate: { type: Date, default: Date.now },
  isPublished: { type: Boolean, default: true }
});

const News = mongoose.models.News || mongoose.model('News', newsSchema);
export default News;