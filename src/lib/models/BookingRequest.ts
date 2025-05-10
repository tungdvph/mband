// /lib/models/BookingRequest.ts
import mongoose, { Schema, Model, Types, Document } from 'mongoose';

export interface IBookingRequest extends Document {
    _id: string;
    eventName: string;
    eventDate: Date;
    location: string;
    eventType: 'wedding' | 'birthday' | 'corporate' | 'festival' | 'other';
    duration: number;
    expectedGuests: number;
    requirements?: string;
    budget?: number | null;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    contactName: string;
    contactPhone: string; // Sẽ được validate bằng regex đơn giản hơn
    contactEmail: string;
    userId?: Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

const bookingRequestSchema = new Schema<IBookingRequest>({
    eventName: {
        type: String,
        required: [true, 'Tên sự kiện là bắt buộc'],
        trim: true,
    },
    eventDate: {
        type: Date,
        required: [true, 'Ngày tổ chức là bắt buộc'],
    },
    location: {
        type: String,
        required: [true, 'Địa điểm là bắt buộc'],
        trim: true,
    },
    eventType: {
        type: String,
        enum: {
            values: ['wedding', 'birthday', 'corporate', 'festival', 'other'],
            message: 'Loại sự kiện không hợp lệ: {VALUE}',
        },
        required: [true, 'Loại sự kiện là bắt buộc'],
    },
    duration: {
        type: Number,
        required: [true, 'Thời lượng (giờ) là bắt buộc'],
        min: [0.5, 'Thời lượng phải ít nhất là 0.5 giờ'],
    },
    expectedGuests: {
        type: Number,
        required: [true, 'Số khách dự kiến là bắt buộc'],
        min: [1, 'Số khách dự kiến phải ít nhất là 1'],
    },
    requirements: {
        type: String,
        trim: true,
        default: '',
    },
    budget: {
        type: Number,
        min: [0, 'Ngân sách không thể âm'],
        default: null,
    },
    status: {
        type: String,
        enum: {
            values: ['pending', 'confirmed', 'cancelled', 'completed'],
            message: 'Trạng thái không hợp lệ: {VALUE}',
        },
        default: 'pending',
        required: true,
    },
    contactName: {
        type: String,
        required: [true, 'Tên người liên hệ là bắt buộc'],
        trim: true,
    },
    contactPhone: {
        type: String,
        required: [true, 'Số điện thoại liên hệ là bắt buộc'],
        trim: true,
        validate: {
            validator: function (v: string) {
                // Regex đơn giản: chỉ chứa số, dài từ 9 đến 11 ký tự
                return /^[0-9]{9,11}$/.test(v);
            },
            message: (props: { value: string }) => `${props.value} không phải là số điện thoại hợp lệ (chỉ chứa số, 9-11 chữ số).`
        }
    },
    contactEmail: {
        type: String,
        required: [true, 'Email liên hệ là bắt buộc'],
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Vui lòng nhập địa chỉ email hợp lệ'],
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        sparse: true,
    },
}, {
    timestamps: true,
    versionKey: '__v',
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            ret.id = ret._id.toString();
        }
    }
});

bookingRequestSchema.index({ eventDate: 1 });
bookingRequestSchema.index({ status: 1, createdAt: -1 });
if (bookingRequestSchema.path('userId')) {
    bookingRequestSchema.index({ userId: 1, createdAt: -1 }, { sparse: true });
}
bookingRequestSchema.index({ contactEmail: 1 });

const modelName = 'BookingRequest';

const BookingRequest = (mongoose.models[modelName] as Model<IBookingRequest>) ||
    mongoose.model<IBookingRequest>(modelName, bookingRequestSchema);

export default BookingRequest;