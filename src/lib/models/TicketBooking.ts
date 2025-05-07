// /lib/models/TicketBooking.ts
import mongoose, { Document, Schema, Types, Model } from 'mongoose';

// Interface cho một mục chi tiết trong bookedItems (cho combo)
export interface BookedItemDetail {
    scheduleId: Types.ObjectId; // Tham chiếu đến Schedule
    eventName: string;          // Tên sự kiện (lưu lại tại thời điểm đặt để tránh thay đổi nếu Schedule gốc sửa)
    date?: Date;               // Ngày diễn ra sự kiện (lưu lại)
    ticketCount: number;        // Số lượng vé cho sự kiện này trong combo
    priceAtBooking: number;     // Giá mỗi vé của sự kiện này tại thời điểm đặt
    _id?: Types.ObjectId;      // MongoDB sẽ tự tạo, nhưng có thể cần nếu bạn muốn id cho sub-document
}

// Interface định nghĩa cấu trúc Document cho TicketBooking trong DB
export interface ITicketBooking extends Document {
    userId?: Types.ObjectId | null; // Tham chiếu đến User (có thể null nếu khách vãng lai đặt)
    customerDetails: {          // Thông tin khách hàng (bắt buộc, ngay cả khi userId tồn tại)
        fullName: string;
        email: string;
        phoneNumber: string;
        notes?: string;
    };

    // Cho đặt vé đơn lẻ, scheduleId sẽ có giá trị. Cho combo, nó có thể là null.
    scheduleId?: Types.ObjectId | null;

    bookingType: 'single' | 'combo'; // Phân loại đặt vé
    bookedItems: BookedItemDetail[];  // Bắt buộc phải có, ngay cả với 'single' (sẽ chứa 1 item)

    ticketCount: number;        // Tổng số vé (cho cả đơn lẻ và combo, là tổng ticketCount từ bookedItems)
    totalPrice: number;         // Tổng tiền cuối cùng (sau khuyến mãi)
    priceBeforeDiscount?: number; // Tổng tiền của các vé trước khi áp dụng khuyến mãi
    appliedPromotion?: {
        description: string;
        discountPercentage: number;
    } | null;
    status: 'pending' | 'confirmed' | 'cancelled' | 'delivered'; // <--- THÊM 'delivered'
    paymentDetails?: {
        paymentMethod?: string;
        transactionId?: string;
        paidAt?: Date;
    };
    // Timestamps được Mongoose tự động quản lý
    createdAt: Date;
    updatedAt: Date;
}

// Schema cho một mục chi tiết trong bookedItems
const BookedItemDetailSchema = new Schema<BookedItemDetail>({
    scheduleId: { type: Schema.Types.ObjectId, ref: 'Schedule', required: true },
    eventName: { type: String, required: true },
    date: { type: Date }, // Ngày diễn ra sự kiện
    ticketCount: { type: Number, required: true, min: 1 },
    priceAtBooking: { type: Number, required: true, min: 0 }, // Giá vé tại thời điểm đặt
}, { _id: false });

const ticketBookingSchema = new Schema<ITicketBooking>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', sparse: true },
    customerDetails: {
        fullName: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        phoneNumber: { type: String, required: true, trim: true },
        notes: { type: String, trim: true },
    },
    scheduleId: { type: Schema.Types.ObjectId, ref: 'Schedule', sparse: true },

    bookingType: { type: String, enum: ['single', 'combo'], required: true },
    bookedItems: {
        type: [BookedItemDetailSchema],
        required: true,
        validate: [(val: BookedItemDetail[]) => val.length > 0, 'Phải có ít nhất một mục được đặt.']
    },

    ticketCount: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true, min: 0 },
    priceBeforeDiscount: { type: Number, min: 0 },
    appliedPromotion: {
        description: { type: String },
        discountPercentage: { type: Number, min: 0, max: 100 },
        _id: false
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'delivered'], // <--- THÊM 'delivered'
        default: 'pending',
        required: true,
    },
    paymentDetails: {
        paymentMethod: { type: String },
        transactionId: { type: String },
        paidAt: { type: Date },
        _id: false
    },
}, {
    timestamps: true,
    versionKey: '__v',
});

ticketBookingSchema.pre<ITicketBooking>('save', function (next) {
    if (this.bookingType === 'single') {
        // ... (logic hiện tại)
    } else if (this.bookingType === 'combo') {
        // ... (logic hiện tại)
    }
    const calculatedTicketCount = this.bookedItems.reduce((sum, item) => sum + item.ticketCount, 0);
    if (this.ticketCount !== calculatedTicketCount) {
        this.ticketCount = calculatedTicketCount;
    }
    next();
});

ticketBookingSchema.index({ userId: 1, createdAt: -1 });
ticketBookingSchema.index({ status: 1, createdAt: -1 });

const modelName = 'TicketBooking';
const TicketBooking = (mongoose.models[modelName] as Model<ITicketBooking>) ||
    mongoose.model<ITicketBooking>(modelName, ticketBookingSchema);

export default TicketBooking;