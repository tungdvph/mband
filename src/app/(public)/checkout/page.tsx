// src/app/api/cart-checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order, { IOrder } from '@/lib/models/Order';
import Schedule, { ISchedule } from '@/lib/models/Schedule';
import { getServerSession } from "next-auth/next";
// import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Định nghĩa kiểu dữ liệu cho Payload (giữ nguyên)
interface CartCheckoutPayload {
    cartItems: {
        scheduleId: string;
        eventName: string;
        quantity: number;
        price: number | null | undefined; // Giữ nguyên vì client có thể gửi null/undefined
    }[];
    customerInfo: {
        fullName: string;
        email: string;
        phoneNumber: string;
        address?: string;
        userId?: string;
        notes?: string;
    };
    payment: {
        method: string;
        totalAmount: number; // Giá client tính
        discountAmount: number; // Discount client tính
        finalAmount: number; // Giá cuối client tính
    };
    distinctItemCount: number;
}

export async function POST(request: NextRequest) {
    // Optional: Bảo vệ API
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // *** SỬA: Gọi hàm connectToDatabase ***
    await connectToDatabase();

    try {
        const body: CartCheckoutPayload = await request.json();

        // --- Server-side Validation (Giữ nguyên logic validation cơ bản) ---
        if (!body.cartItems || body.cartItems.length === 0) {
            return NextResponse.json({ error: 'Giỏ hàng trống.' }, { status: 400 });
        }
        if (!body.customerInfo || !body.customerInfo.fullName || !body.customerInfo.email || !body.customerInfo.phoneNumber) {
            return NextResponse.json({ error: 'Thiếu thông tin khách hàng.' }, { status: 400 });
        }
        if (body.payment.method === 'cod' && !body.customerInfo.address) {
            return NextResponse.json({ error: 'Địa chỉ là bắt buộc khi chọn COD.' }, { status: 400 });
        }
        if (!body.payment) {
            return NextResponse.json({ error: 'Thiếu thông tin thanh toán.' }, { status: 400 });
        }

        // --- Kiểm tra lại giá và tính toán phía server ---
        let serverTotalPrice = 0;
        // Mảng này giờ sẽ có kiểu dữ liệu dựa trên cấu trúc IOrder['items'][number] nếu bạn đã định nghĩa nó chuẩn
        const validatedItems: { scheduleId: string; eventName: string; quantity: number; price: number }[] = [];

        for (const item of body.cartItems) {
            // Sử dụng model Schedule đã import
            const schedule: ISchedule | null = await Schedule.findById(item.scheduleId).select('price status eventName').lean(); // Lấy thêm eventName từ DB để đảm bảo

            if (!schedule) {
                // Dùng eventName từ client gửi lên nếu không tìm thấy schedule (hoặc báo lỗi cụ thể hơn)
                return NextResponse.json({ error: `Sự kiện với ID ${item.scheduleId} không tồn tại.` }, { status: 404 });
            }
            if (schedule.status === 'cancelled') {
                // Sử dụng eventName từ DB cho thông báo lỗi chính xác hơn
                return NextResponse.json({ error: `Sự kiện "${schedule.eventName}" đã bị hủy hoặc tạm hoãn.` }, { status: 400 });
            }

            // Luôn dùng giá từ DB
            const currentPrice = schedule.price ?? 0;
            serverTotalPrice += currentPrice * item.quantity;

            validatedItems.push({
                scheduleId: item.scheduleId,
                eventName: schedule.eventName, // Dùng tên sự kiện từ DB
                quantity: item.quantity,
                price: currentPrice, // Lưu giá hiện tại (từ DB) vào đơn hàng
            });
        }

        // Tính lại discount và giá cuối phía server
        const serverDistinctItemCount = validatedItems.length;
        let serverDiscount = 0;
        const DISCOUNT_THRESHOLD = 3; // Định nghĩa lại hoặc import từ config nếu cần
        const DISCOUNT_PERCENTAGE = 0.2; // Định nghĩa lại hoặc import
        if (serverDistinctItemCount >= DISCOUNT_THRESHOLD) {
            serverDiscount = serverTotalPrice * DISCOUNT_PERCENTAGE;
        }
        const serverFinalPrice = serverTotalPrice - serverDiscount;

        // (Optional) So sánh giá cuối cùng client và server, nếu muốn chặt chẽ hơn
        // const priceDifference = Math.abs(serverFinalPrice - body.payment.finalAmount);
        // if (priceDifference > 0.01) { // Cho phép sai số nhỏ
        //     console.warn("Price mismatch detected:", { client: body.payment.finalAmount, server: serverFinalPrice });
        //     // return NextResponse.json({ error: 'Giá đơn hàng có thay đổi, vui lòng kiểm tra lại giỏ hàng.' }, { status: 400 });
        // }


        // --- Tạo đơn hàng mới ---
        // Sử dụng model Order đã import
        const newOrder = new Order({ // Kiểu dữ liệu của newOrder sẽ là IOrder nếu bạn dùng Mongoose đúng cách
            items: validatedItems, // Dùng items đã được validate với giá và tên từ server
            customer: body.customerInfo, // Giữ thông tin khách hàng từ client
            payment: {
                method: body.payment.method,
                totalAmount: serverTotalPrice,    // Dùng giá trị server tính
                discountAmount: serverDiscount,   // Dùng giá trị server tính
                finalAmount: serverFinalPrice,     // Dùng giá trị server tính
                status: 'pending',                // Trạng thái thanh toán ban đầu
            },
            orderStatus: 'pending',              // Trạng thái đơn hàng ban đầu
            distinctItemCount: serverDistinctItemCount, // Lưu số loại sản phẩm thực tế
        });

        await newOrder.save();

        // --- Các xử lý khác (Optional) ---
        // Gửi email, thông báo, trừ kho,...
        // await sendOrderConfirmationEmail(newOrder);

        // Trả về kết quả thành công với ID đơn hàng
        return NextResponse.json({ success: true, orderId: newOrder._id, message: 'Đặt hàng thành công!' }, { status: 201 });

    } catch (error: any) {
        console.error('Cart Checkout API Error:', error); // Log lỗi chi tiết phía server
        // Trả về lỗi chung chung cho client
        return NextResponse.json({ error: 'Đã xảy ra lỗi phía server khi xử lý đơn hàng của bạn.' }, { status: 500 });
    }
}