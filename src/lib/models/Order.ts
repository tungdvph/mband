
import mongoose, { Document, Schema, Model } from 'mongoose';

interface ICartItem {
    scheduleId: mongoose.Schema.Types.ObjectId;
    eventName: string;
    quantity: number;
    price: number; // Lưu giá tại thời điểm đặt hàng
}

interface ICustomerInfo {
    fullName: string;
    email: string;
    phoneNumber: string;
    address?: string;
    userId?: mongoose.Schema.Types.ObjectId;
    notes?: string;
}

interface IPaymentInfo {
    method: string;
    totalAmount: number;
    discountAmount: number;
    finalAmount: number;
    status: 'pending' | 'paid' | 'failed'; // Trạng thái thanh toán
}

export interface IOrder extends Document {
    items: ICartItem[];
    customer: ICustomerInfo;
    payment: IPaymentInfo;
    orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'; // Trạng thái đơn hàng
    orderDate: Date;
    distinctItemCount: number; // Lưu lại để tham khảo
}

const OrderSchema: Schema<IOrder> = new Schema({
    items: [{
        scheduleId: { type: Schema.Types.ObjectId, ref: 'Schedule', required: true },
        eventName: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true }, // Nên lưu giá cố định
    }],
    customer: {
        fullName: { type: String, required: true },
        email: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        address: { type: String },
        userId: { type: Schema.Types.ObjectId, ref: 'User' }, // Tham chiếu đến User nếu có
        notes: { type: String },
    },
    payment: {
        method: { type: String, required: true },
        totalAmount: { type: Number, required: true },
        discountAmount: { type: Number, required: true, default: 0 },
        finalAmount: { type: Number, required: true },
        status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    },
    orderStatus: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
    },
    orderDate: { type: Date, default: Date.now },
    distinctItemCount: { type: Number, required: true },
});

// Kiểm tra xem model đã tồn tại chưa trước khi tạo mới
const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
