import mongoose, { Document, Model } from 'mongoose';

export interface IComment extends Document {
  musicId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userFullName: string;
  content: string;
  createdAt: Date;
}

const commentSchema = new mongoose.Schema({
  musicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Music', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userFullName: { type: String, required: true },
  content: { type: String, required: true }
}, { timestamps: { createdAt: true, updatedAt: false } });

let Comment: Model<IComment>;
try {
  Comment = mongoose.model<IComment>('Comment');
} catch {
  Comment = mongoose.model<IComment>('Comment', commentSchema);
}
export default Comment;