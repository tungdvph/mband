// src/lib/models/Comment.ts
import mongoose, { Schema, Document, Model, models } from 'mongoose';

export interface IComment extends Document {
    _id: mongoose.Types.ObjectId;
    // Thay đổi: Cả hai đều không bắt buộc ở mức schema,
    // nhưng logic API sẽ đảm bảo ít nhất một cái được cung cấp
    musicId?: mongoose.Types.ObjectId | null;
    newsId?: mongoose.Types.ObjectId | null;
    userId: mongoose.Types.ObjectId;
    userFullName: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    parentId?: mongoose.Types.ObjectId | null;
}

const commentSchema: Schema<IComment> = new Schema({
    musicId: { // <-- Giữ lại nhưng không required
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Music',
        required: false, // <-- Thay đổi: không bắt buộc
        index: true
    },
    newsId: { // <-- Thêm trường newsId
        type: mongoose.Schema.Types.ObjectId,
        ref: 'News',
        required: false, // <-- Thay đổi: không bắt buộc
        index: true
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
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null,
        index: true
    }
}, {
    timestamps: true
});

// Thêm validator để đảm bảo có musicId hoặc newsId (hoặc cả hai nếu logic cho phép)
commentSchema.pre('validate', function (next) {
    if (!this.musicId && !this.newsId) {
        next(new Error('Comment must belong to either Music or News (musicId or newsId is required).'));
    } else {
        next();
    }
});

const Comment: Model<IComment> = models.Comment || mongoose.model<IComment>('Comment', commentSchema);

export default Comment;