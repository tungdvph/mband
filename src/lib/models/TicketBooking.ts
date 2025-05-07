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
    customerDetails: {        // Thông tin khách hàng (bắt buộc, ngay cả khi userId tồn tại)
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
    status: 'pending' | 'confirmed' | 'cancelled';
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
}, { _id: false }); // _id: false nếu bạn không muốn _id cho subdocuments này, hoặc true nếu muốn

const ticketBookingSchema = new Schema<ITicketBooking>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', sparse: true }, // sparse cho phép null/undefined
    customerDetails: {
        fullName: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        phoneNumber: { type: String, required: true, trim: true },
        notes: { type: String, trim: true },
    },
    scheduleId: { type: Schema.Types.ObjectId, ref: 'Schedule', sparse: true }, // Cho phép null cho combo

    bookingType: { type: String, enum: ['single', 'combo'], required: true },
    bookedItems: {
        type: [BookedItemDetailSchema],
        required: true, // Luôn yêu cầu mảng này, dù là single hay combo
        validate: [(val: BookedItemDetail[]) => val.length > 0, 'Phải có ít nhất một mục được đặt.']
    },

    ticketCount: { type: Number, required: true, min: 1 }, // Tổng số vé
    totalPrice: { type: Number, required: true, min: 0 }, // Tổng tiền sau khuyến mãi
    priceBeforeDiscount: { type: Number, min: 0 }, // Tổng tiền trước khuyến mãi
    appliedPromotion: {
        description: { type: String },
        discountPercentage: { type: Number, min: 0, max: 100 },
        _id: false // Không cần _id cho sub-object này
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
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

// Middleware để đảm bảo tính nhất quán (tùy chọn, có thể xử lý ở API)
ticketBookingSchema.pre<ITicketBooking>('save', function (next) {
    if (this.bookingType === 'single') {
        if (this.bookedItems.length !== 1 || !this.scheduleId) {
            // Nếu là 'single', bookedItems phải có đúng 1 item và scheduleId phải tồn tại
            // Hoặc bạn có thể tự động tạo bookedItems[0] từ scheduleId và ticketCount ở đây
            // return next(new Error('Đặt vé đơn lẻ không hợp lệ.'));
        }
        // Đảm bảo scheduleId khớp với scheduleId trong bookedItems[0]
        if (this.scheduleId && this.bookedItems[0] && !this.scheduleId.equals(this.bookedItems[0].scheduleId)) {
            // return next(new Error('scheduleId không khớp với mục đã đặt cho đặt vé đơn lẻ.'));
        }
    } else if (this.bookingType === 'combo') {
        this.scheduleId = null; // Đảm bảo scheduleId là null cho combo
        if (this.bookedItems.length < 1) { // Combo phải có ít nhất 1, thường là >= 2
            // return next(new Error('Combo phải có ít nhất một sự kiện.'));
        }
    }

    // Tính lại tổng ticketCount từ bookedItems nếu chưa đúng
    const calculatedTicketCount = this.bookedItems.reduce((sum, item) => sum + item.ticketCount, 0);
    if (this.ticketCount !== calculatedTicketCount) {
        // console.warn("Đang cập nhật lại ticketCount dựa trên bookedItems.");
        this.ticketCount = calculatedTicketCount;
    }

    next();
});

ticketBookingSchema.index({ userId: 1, createdAt: -1 }); // Cho lịch sử đặt vé của người dùng
ticketBookingSchema.index({ status: 1, createdAt: -1 }); // Cho quản lý admin

const modelName = 'TicketBooking';
const TicketBooking = (mongoose.models[modelName] as Model<ITicketBooking>) ||
    mongoose.model<ITicketBooking>(modelName, ticketBookingSchema);

export default TicketBooking;
