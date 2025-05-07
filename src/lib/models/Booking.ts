// /lib/models/Booking.js
import mongoose, { Schema, Types } from 'mongoose';

// --- Schema cho Booking (Mua vé sự kiện) ---

const bookingSchema = new Schema({
  // === Liên kết và Thông tin cốt lõi ===
  user: { // ID của người dùng đã đăng nhập (nếu có)
    type: Schema.Types.ObjectId,
    ref: 'User', // Tham chiếu đến model User của bạn (nếu có)
    required: false // Có thể không bắt buộc nếu cho phép khách đặt vé
  },
  schedule: { // ID của sự kiện (Schedule) được đặt vé
    type: Schema.Types.ObjectId,
    ref: 'Schedule', // Tham chiếu đến model Schedule
    required: true
  },
  scheduleDetails: { // Lưu trữ snapshot thông tin sự kiện tại thời điểm đặt vé
    type: { // Định nghĩa là một sub-document
      eventName: { type: String, required: true },
      date: { type: Date, required: true },
      startTime: { type: String, required: true },
      venueName: { type: String, required: true }, // Lấy từ schedule.venue.name
      // Thêm các trường khác nếu cần (ví dụ: city)
    },
    required: true,
    _id: false // Không cần _id cho sub-document này
  },
  quantity: { // Số lượng vé (thường là 1 trong luồng checkout từ giỏ hàng này)
    type: Number,
    required: true,
    min: [1, 'Số lượng vé phải ít nhất là 1'],
    default: 1
  },

  // === Thông tin Giá cả và Khuyến mãi ===
  originalPricePerTicket: { // Giá gốc của 1 vé tại thời điểm đặt
    type: Number,
    required: true,
    min: [0, 'Giá gốc không thể âm']
  },
  appliedPromotion: { // Thông tin khuyến mãi đã được áp dụng (nếu có)
    type: { // Sub-document
      description: { type: String, required: true }, // Mô tả KM (ví dụ: "Giảm 10% khi mua từ 3 sự kiện")
      discountPercentage: { type: Number, required: true, min: 0, max: 100 }, // % giảm giá
      minCartItems: { type: Number, required: true, min: 1 }, // Số item tối thiểu trong giỏ để được KM này
      // code?: { type: String } // Có thể thêm mã KM nếu dùng mã
      _id: false
    },
    required: false, // Không bắt buộc, chỉ có khi KM được áp dụng
    default: null
  },
  discountAmount: { // Tổng số tiền được giảm giá
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Tiền giảm giá không thể âm']
  },
  finalPrice: { // Giá cuối cùng khách hàng phải trả sau khi trừ KM
    type: Number,
    required: true,
    min: [0, 'Giá cuối cùng không thể âm']
  },

  // === Thông tin Khách hàng ===
  customerInfo: {
    type: { // Sub-document
      fullName: { type: String, required: [true, 'Họ tên là bắt buộc'] },
      email: { type: String, required: [true, 'Email là bắt buộc'] /*, match: /.../ */ }, // Có thể thêm regex validate email
      phoneNumber: { type: String, required: [true, 'Số điện thoại là bắt buộc'] },
      address: { // Địa chỉ giao hàng (chỉ bắt buộc nếu thanh toán COD)
        type: String,
        required: function () {
          // `this` ở đây tham chiếu đến document Booking đang được tạo/cập nhật
          // Chỉ yêu cầu địa chỉ nếu phương thức thanh toán là 'cod'
          // Lưu ý: validation phức tạp kiểu này đôi khi dễ thực hiện ở tầng API hơn
          // return this.paymentMethod === 'cod';
          return false; // Tạm thời không bắt buộc ở Schema, kiểm tra ở API route
        }
      },
      _id: false
    },
    required: true
  },

  // === Thông tin Thanh toán và Trạng thái ===
  paymentMethod: {
    type: String,
    enum: {
      values: ['cod', 'online'], // Các phương thức được chấp nhận
      message: 'Phương thức thanh toán không hợp lệ: {VALUE}'
    },
    required: [true, 'Phương thức thanh toán là bắt buộc']
  },
  // paymentStatus: { // Có thể thêm trạng thái thanh toán riêng
  //   type: String,
  //   enum: ['pending', 'paid', 'failed', 'refunded'],
  //   default: 'pending'
  // },
  bookingStatus: { // Trạng thái chung của đơn đặt vé
    type: String,
    enum: {
      values: ['pending', 'confirmed', 'cancelled', 'completed'],
      message: 'Trạng thái đặt vé không hợp lệ: {VALUE}'
    },
    default: 'pending',
    required: true
  }

}, {
  timestamps: true, // Tự động thêm createdAt và updatedAt
  versionKey: false // Không sử dụng trường __v của Mongoose
});

// --- Indexes (Tùy chọn, giúp tăng tốc độ truy vấn) ---
bookingSchema.index({ user: 1 }); // Tìm kiếm theo user
bookingSchema.index({ schedule: 1 }); // Tìm kiếm theo sự kiện
bookingSchema.index({ 'customerInfo.email': 1 }); // Tìm kiếm theo email khách hàng
bookingSchema.index({ createdAt: -1 }); // Sắp xếp theo ngày tạo mới nhất

// --- Middleware (Ví dụ: validate address trước khi save nếu là COD) ---
// (Cách này an toàn hơn là dùng required function trong schema)
// bookingSchema.pre('save', function(next) {
//   if (this.paymentMethod === 'cod' && !this.customerInfo.address) {
//     next(new Error('Địa chỉ là bắt buộc cho phương thức thanh toán COD.'));
//   } else {
//     next();
//   }
// });


// --- Xuất Model ---
const modelName = 'Booking';
// Kiểm tra xem model đã tồn tại chưa trước khi định nghĩa lại (quan trọng cho HMR)
const Booking = mongoose.models[modelName] || mongoose.model(modelName, bookingSchema);

export default Booking;