import mongoose, { Document, Schema, Types, Model } from 'mongoose';
// Giả sử ISchedule và IVenue được export từ file Schedule model của bạn
import { ISchedule, IVenue } from './Schedule';

// Interface cho thông tin schedule được nhúng vào cart item
export interface CartScheduleInfo {
    _id: Types.ObjectId; // ID của Schedule gốc
    eventName: string;
    date: Date | string;
    startTime?: string;
    endTime?: string;
    venue: IVenue;
    price?: number | null;
    description?: string;
    type?: ISchedule['type']; // Lấy kiểu từ ISchedule
    status?: ISchedule['status']; // Lấy kiểu từ ISchedule
}

// Interface cho UserCartItem Document
export interface IUserCartItem extends Document {
    userId: Types.ObjectId;
    scheduleId: Types.ObjectId; // ID của Schedule gốc
    scheduleDetails: CartScheduleInfo; // Thông tin chi tiết của schedule tại thời điểm thêm vào giỏ
    quantity: number;
    addedAt: Date; // Ngày thêm vào giỏ
    createdAt: Date; // << THÊM VÀO: Mongoose sẽ tự động thêm trường này
    updatedAt: Date; // << THÊM VÀO: Mongoose sẽ tự động thêm trường này
}

// Schema cho CartScheduleInfo (sub-document)
const CartScheduleInfoSchema = new Schema<CartScheduleInfo>({
    _id: { type: Schema.Types.ObjectId, required: true },
    eventName: { type: String, required: true },
    date: { type: Schema.Types.Mixed, required: true }, // Mixed để cho phép Date hoặc string
    startTime: { type: String },
    endTime: { type: String },
    venue: { // Cấu trúc của venue phải khớp với IVenue
        name: { type: String, required: true, trim: true },
        address: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true }
    },
    price: { type: Number, default: null },
    description: { type: String },
    type: { type: String }, // Schema dùng String, enum sẽ được validate ở ISchedule gốc nếu cần
    status: { type: String }, // Schema dùng String, enum sẽ được validate ở ISchedule gốc nếu cần
}, { _id: false });

// Schema cho UserCartItem
const UserCartItemSchema = new Schema<IUserCartItem>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    scheduleId: { type: Schema.Types.ObjectId, ref: 'Schedule', required: true },
    scheduleDetails: { type: CartScheduleInfoSchema, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    addedAt: { type: Date, default: Date.now },
}, {
    timestamps: true, // Tự động thêm createdAt và updatedAt (kiểu Date)
    versionKey: false,
});

// Index để đảm bảo một user không có nhiều bản ghi cho cùng một scheduleId
UserCartItemSchema.index({ userId: 1, scheduleId: 1 }, { unique: true });

const modelName = 'UserCartItem';
// Kiểm tra xem model đã tồn tại chưa trước khi tạo mới (HMR-friendly)
const UserCartItem = (mongoose.models[modelName] as Model<IUserCartItem>) ||
    mongoose.model<IUserCartItem>(modelName, UserCartItemSchema);

export default UserCartItem;
