// src/app/api/cart-checkout/route.ts (Hoặc .js nếu bạn dùng JavaScript)

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb'; // *** SỬA: Import hàm kết nối DB của bạn ***
import Schedule from '@/lib/models/Schedule';      // Model Schedule
import Booking from '@/lib/models/Booking';        // Model Booking (đã cập nhật)
import { PromotionRule } from '@/types/cart';      // Import type Khuyến mãi (nếu dùng TS)

// --- Định nghĩa lại các quy tắc KM phía server để đảm bảo an toàn ---
// (Nên đồng bộ với client hoặc lấy từ DB)
const SERVER_PROMOTION_RULES: PromotionRule[] = [
    { minItems: 4, discountPercentage: 15, description: 'Giảm 15% khi mua từ 4 sự kiện' },
    { minItems: 3, discountPercentage: 10, description: 'Giảm 10% khi mua từ 3 sự kiện' },
    { minItems: 2, discountPercentage: 5, description: 'Giảm 5% khi mua từ 2 sự kiện' },
];
// ---------------------------------------------------------------

// Hàm tính KM phía Server
const calculateServerPromotion = (itemCount: number): PromotionRule | null => {
    // Đảm bảo itemCount là số hợp lệ
    if (typeof itemCount !== 'number' || itemCount < 0) {
        return null;
    }
    for (const rule of SERVER_PROMOTION_RULES) {
        if (itemCount >= rule.minItems) {
            return rule;
        }
    }
    return null;
}

export async function POST(request: Request) {
    // --- Kết nối Database ---
    try {
        await connectToDatabase(); // *** SỬA: Gọi hàm kết nối DB của bạn ***
    } catch (dbError: any) {
        console.error("Database Connection Error in API:", dbError);
        return NextResponse.json({ error: 'Lỗi kết nối cơ sở dữ liệu.' }, { status: 500 });
    }
    // ------------------------

    try {
        const body = await request.json();
        const {
            selectedScheduleId,
            ticketCount, // = 1 trong luồng này
            paymentMethod,
            fullName,
            email,
            phoneNumber,
            address, // Chỉ có nếu là COD
            cartItemCount, // Số lượng item trong giỏ lúc user nhấn checkout
            // appliedPromotionDescription, // Client tính, chỉ để tham khảo nếu cần log
            // promotionCode // Nếu có ô nhập mã KM
        } = body;

        // --- Validation dữ liệu đầu vào ---
        if (!selectedScheduleId || !fullName || !email || !phoneNumber || !paymentMethod || ticketCount !== 1 || typeof cartItemCount !== 'number') {
            return NextResponse.json({ error: 'Dữ liệu không hợp lệ hoặc thiếu thông tin.' }, { status: 400 });
        }
        // Kiểm tra địa chỉ nếu là COD
        if (paymentMethod === 'cod' && (!address || typeof address !== 'string' || address.trim() === '')) {
            return NextResponse.json({ error: 'Địa chỉ là bắt buộc và không được để trống cho phương thức COD.' }, { status: 400 });
        }

        // --- Lấy thông tin sự kiện đã chọn từ DB ---
        const selectedSchedule = await Schedule.findById(selectedScheduleId).lean(); // Dùng lean() để lấy plain JS object nếu không cần phương thức Mongoose
        if (!selectedSchedule) {
            return NextResponse.json({ error: 'Không tìm thấy sự kiện được chọn.' }, { status: 404 });
        }
        // Kiểm tra trạng thái sự kiện
        if (selectedSchedule.status === 'cancelled' || selectedSchedule.status === 'completed' || selectedSchedule.status === 'postponed') {
            return NextResponse.json({ error: `Sự kiện "${selectedSchedule.eventName}" đã ${selectedSchedule.status === 'cancelled' ? 'bị hủy' : (selectedSchedule.status === 'postponed' ? 'bị hoãn' : 'hoàn thành')}. Không thể đặt vé.` }, { status: 400 });
        }

        const schedulePrice = selectedSchedule.price ?? 0; // Giá gốc từ DB

        // --- Tính toán lại Khuyến mãi phía Server ---
        const serverCalculatedPromotion = calculateServerPromotion(cartItemCount);
        const serverDiscountPercentage = serverCalculatedPromotion?.discountPercentage ?? 0;
        // Đảm bảo làm tròn tiền giảm giá (ví dụ: làm tròn đến đơn vị đồng)
        const serverDiscountAmount = Math.round((schedulePrice * serverDiscountPercentage) / 100);
        const serverFinalPrice = Math.max(0, schedulePrice - serverDiscountAmount); // Đảm bảo giá không âm

        // --- Tạo bản ghi Booking mới ---
        const newBooking = new Booking({
            user: null, // TODO: Lấy user ID từ session/token nếu người dùng đã đăng nhập
            schedule: selectedScheduleId,
            scheduleDetails: { // Lưu trữ snapshot thông tin schedule tại thời điểm đặt
                eventName: selectedSchedule.eventName,
                date: selectedSchedule.date,
                startTime: selectedSchedule.startTime,
                venueName: selectedSchedule.venue.name,
            },
            quantity: ticketCount,
            originalPricePerTicket: schedulePrice,
            appliedPromotion: serverCalculatedPromotion ? {
                description: serverCalculatedPromotion.description,
                discountPercentage: serverDiscountPercentage,
                minCartItems: serverCalculatedPromotion.minItems,
            } : null,
            discountAmount: serverDiscountAmount,
            finalPrice: serverFinalPrice,
            customerInfo: {
                fullName,
                email,
                phoneNumber,
                // Chỉ lưu địa chỉ nếu là COD và có giá trị
                address: (paymentMethod === 'cod' && address) ? address.trim() : undefined,
            },
            paymentMethod: paymentMethod,
            bookingStatus: 'pending', // Hoặc 'confirmed' tùy logic nghiệp vụ
        });

        // Lưu vào DB
        await newBooking.save();

        // TODO: Xử lý các tác vụ phụ sau khi lưu thành công:
        // 1. Gửi email xác nhận cho khách hàng.
        // 2. Thông báo cho admin (nếu cần).
        // 3. Trừ số lượng vé tồn kho (nếu quản lý inventory).
        // 4. Xử lý thanh toán online nếu paymentMethod là 'online' (chuyển hướng đến cổng TT, cập nhật trạng thái sau).

        // --- Phản hồi thành công cho client ---
        return NextResponse.json({
            message: 'Đặt vé thành công!',
            bookingId: newBooking._id, // Trả về ID của booking mới tạo
            finalPrice: serverFinalPrice // Trả về giá cuối cùng server đã tính
        }, { status: 201 }); // Status 201 Created

    } catch (error: any) {
        console.error("API Checkout Error:", error);
        // Phân loại lỗi để trả về thông báo phù hợp hơn
        if (error.name === 'ValidationError') { // Lỗi từ Mongoose validation
            return NextResponse.json({ error: 'Dữ liệu không hợp lệ.', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Lỗi máy chủ nội bộ khi xử lý checkout.' }, { status: 500 });
    }
}

// Optional: Thêm các phương thức khác như GET nếu cần xem lại đơn hàng (cần xác thực)
// export async function GET(request: Request) { ... }