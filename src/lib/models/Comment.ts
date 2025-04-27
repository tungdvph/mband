// src/lib/models/Comment.ts
import mongoose, { Schema, Document, Model, models } from 'mongoose';

// Interface vẫn giữ nguyên, đã bao gồm các trường cần thiết
export interface IComment extends Document {
    musicId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    userFullName: string;
    content: string;
    createdAt: Date; // Trường này sẽ được timestamps quản lý, nhưng để trong interface cho rõ ràng cũng không sao
    // updatedAt không có do cấu hình timestamps
}

// Schema cũng đã đúng, đặc biệt là các ref
const commentSchema: Schema<IComment> = new Schema({
    musicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Music', // Chính xác
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Chính xác
        required: true
    },
    userFullName: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    }
}, {
    // timestamps: { createdAt: true, updatedAt: false } // Cấu hình này đúng, sẽ tự thêm createdAt
    timestamps: true // Có thể dùng timestamps: true nếu bạn muốn cả createdAt và updatedAt
    // Hoặc giữ nguyên { createdAt: true, updatedAt: false } nếu chỉ muốn createdAt
});

// Cách định nghĩa model chuẩn hơn trong Next.js để tránh lỗi HMR (Hot Module Replacement)
// Kiểm tra xem model 'Comment' đã tồn tại trong mongoose.models chưa, nếu có thì dùng lại, nếu chưa thì tạo mới.
const Comment: Model<IComment> = models.Comment || mongoose.model<IComment>('Comment', commentSchema);

export default Comment;