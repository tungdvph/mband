// src/lib/models/Comment.ts
import mongoose, { Schema, Document, Model, models } from 'mongoose';

// Cập nhật interface để bao gồm parentId (tùy chọn)
export interface IComment extends Document {
    _id: mongoose.Types.ObjectId; // Thêm _id cho rõ ràng type
    musicId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    userFullName: string;
    content: string;
    createdAt: Date;
    updatedAt: Date; // Sẽ có do timestamps: true
    parentId?: mongoose.Types.ObjectId | null; // Thêm parentId, có thể là null
}

// Thêm parentId vào schema
const commentSchema: Schema<IComment> = new Schema({
    musicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Music',
        required: true,
        index: true // Thêm index để tăng tốc query theo musicId
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userFullName: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    // Thêm trường parentId vào đây
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment', // Tham chiếu lại chính model Comment
        default: null, // Giá trị mặc định là null cho comment gốc
        index: true // Thêm index để tăng tốc query tìm replies
    }
}, {
    timestamps: true // Giữ nguyên timestamps: true để có createdAt và updatedAt
});

// Giữ nguyên cách định nghĩa model
const Comment: Model<IComment> = models.Comment || mongoose.model<IComment>('Comment', commentSchema);

export default Comment;