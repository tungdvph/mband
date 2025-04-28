// /app/api/ticket-booking/route.ts

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import TicketBooking from '@/lib/models/TicketBooking';
import Schedule from '@/lib/models/Schedule'; // Import model Schedule để lấy giá vé, kiểm tra
import User from '@/lib/models/User';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';

// === QUAN TRỌNG: Import cả hai cấu hình Auth ===
// Đảm bảo tên file và đường dẫn chính xác
import { publicAuthOptions } from '@/lib/publicAuth'; // Cấu hình cho user public
import { adminAuthOptions } from '@/lib/adminAuth';   // Cấu hình cho admin

// Khuyến nghị sử dụng runtime Node.js khi làm việc với cơ sở dữ liệu Mongoose truyền thống
export const runtime = 'nodejs';

// === POST: Tạo mới một lượt đặt vé (SỬA LẠI CHO PUBLIC USER) ===
export async function POST(request: Request) {
    console.log("--- [API] POST /api/ticket-booking (User Booking Attempt) ---");
    try {
        console.log("1. Getting PUBLIC user session...");
        // Lấy session của người dùng đang đăng nhập ở trang public
        const session = await getServerSession(publicAuthOptions); // <<< DÙNG publicAuthOptions

        // Kiểm tra xem user đã đăng nhập chưa
        if (!session?.user?.id) {
            console.warn("   User not authenticated.");
            // Frontend cần xử lý lỗi 401 này và yêu cầu đăng nhập
            return NextResponse.json({ error: 'Unauthorized. Please log in to book tickets.' }, { status: 401 });
        }
        const loggedInUserId = session.user.id; // <<< Đây là ID của USER đang đặt vé
        console.log(`   Authenticated Public User ID: ${loggedInUserId}`);

        console.log("2. Connecting to DB...");
        await connectToDatabase();
        console.log("   DB Connected.");

        console.log("3. Parsing request body (JSON)...");
        // Frontend đang gửi JSON
        const body = await request.json();
        // Lấy các trường cần thiết từ body. KHÔNG LẤY userId từ body.
        const { scheduleId, ticketCount, seatInfo, paymentMethod /*, các trường khác nếu có */ } = body;
        console.log(`   Received scheduleId: ${scheduleId}, ticketCount: ${ticketCount}`);

        // === Validate dữ liệu đầu vào cơ bản ===
        if (!scheduleId || !ticketCount) {
            console.error("   Validation Error: Missing scheduleId or ticketCount.");
            return NextResponse.json({ error: 'Missing schedule ID or ticket count' }, { status: 400 });
        }
        if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
            console.error("   Validation Error: Invalid scheduleId format.");
            return NextResponse.json({ error: 'Invalid schedule ID format' }, { status: 400 });
        }
        if (typeof ticketCount !== 'number' || ticketCount < 1) {
            console.error("   Validation Error: Invalid ticketCount.");
            return NextResponse.json({ error: 'Invalid ticket count' }, { status: 400 });
        }
        // === === === === === === === === === === ===

        // === Lấy thông tin Schedule để kiểm tra và tính giá ===
        console.log(`4. Fetching Schedule details for ID: ${scheduleId}...`);
        const schedule = await Schedule.findById(scheduleId);
        if (!schedule) {
            console.error(`   Schedule with ID ${scheduleId} not found.`);
            return NextResponse.json({ error: 'Schedule not found or has been removed.' }, { status: 404 });
        }
        console.log(`   Found Schedule: ${schedule.eventName}`);

        // (Tùy chọn) Kiểm tra số vé còn lại (ví dụ: nếu có trường 'availableTickets')
        // if (schedule.availableTickets !== undefined && schedule.availableTickets < ticketCount) {
        //     console.warn(`   Not enough tickets available for schedule ${scheduleId}. Requested: ${ticketCount}, Available: ${schedule.availableTickets}`);
        //     return NextResponse.json({ error: 'Sorry, not enough tickets available for this event.' }, { status: 400 });
        // }

        // Lấy giá vé từ schedule. Đặt giá mặc định nếu không có.
        const pricePerTicket = schedule.price ?? 100000; // Sử dụng ?? để xử lý cả null và undefined
        const calculatedTotalPrice = ticketCount * pricePerTicket;
        console.log(`   Price per ticket: ${pricePerTicket}, Calculated total price: ${calculatedTotalPrice}`);
        // === === === === === === === === === === === === === === ===

        console.log("5. Creating new TicketBooking document...");
        const newBooking = new TicketBooking({
            scheduleId: scheduleId,
            userId: loggedInUserId, // <<< LƯU ĐÚNG ID CỦA USER PUBLIC TỪ SESSION
            ticketCount: ticketCount,
            totalPrice: calculatedTotalPrice, // <<< Dùng giá đã tính toán/xác thực ở backend
            status: 'pending', // Trạng thái mặc định khi mới tạo
            seatInfo: seatInfo, // Lưu thông tin ghế nếu có
            // Thêm các trường khác liên quan đến booking nếu model có, ví dụ:
            // paymentMethod: paymentMethod,
        });

        console.log("6. Saving booking to DB...");
        await newBooking.save();
        console.log(`   Booking saved successfully with ID: ${newBooking._id} for User ID: ${loggedInUserId}`);

        // === (QUAN TRỌNG - NÊN LÀM) Cập nhật số lượng vé còn lại trong Schedule ===
        // Ví dụ: Giảm số lượng vé đi, nếu có trường availableTickets
        // try {
        //      await Schedule.findByIdAndUpdate(scheduleId, { $inc: { availableTickets: -ticketCount } });
        //      console.log(`   Successfully decremented available tickets for schedule ${scheduleId} by ${ticketCount}`);
        // } catch (updateError) {
        //      console.error(`   ERROR updating available tickets for schedule ${scheduleId}:`, updateError);
        //      // Cân nhắc xử lý lỗi này: có thể hủy booking vừa tạo hoặc ghi log để xử lý sau
        // }
        // === === === === === === === === === === === === === === === === === === ===

        console.log("7. Populating response data for the created booking...");
        // Populate thông tin trả về cho client (không bắt buộc nhưng thường hữu ích)
        const populatedBooking = await TicketBooking.findById(newBooking._id)
            .populate({ path: 'scheduleId', model: Schedule, select: 'eventName date price' }) // Lấy thêm thông tin schedule
            .populate({ path: 'userId', model: User, select: 'fullName email' }); // Lấy thông tin user

        console.log("8. Returning success response (201 Created)...");
        return NextResponse.json(populatedBooking, { status: 201 }); // Trả về 201 Created

    } catch (error: any) {
        console.error('--- [API ERROR] POST /api/ticket-booking: ---', error);
        if (error.name === 'ValidationError') {
            // Lỗi validation từ Mongoose Schema
            console.error("   Validation Error Details:", error.errors);
            return NextResponse.json({ error: 'Invalid data provided', details: error.errors }, { status: 400 });
        }
        // Các lỗi khác
        return NextResponse.json(
            { error: 'An unexpected error occurred while creating the ticket booking.', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}


// === GET: Lấy danh sách tất cả lượt đặt vé (cho admin) ===
// Hàm này dùng adminAuthOptions và đã được sửa đúng ở các bước trước
export async function GET() {
    console.log("--- [API] GET /api/ticket-booking (Admin Request) ---");
    try {
        // Xác thực quyền admin
        console.log("1. Getting ADMIN session...");
        const session = await getServerSession(adminAuthOptions); // <<< Dùng adminAuthOptions là ĐÚNG cho admin
        if (!session || session.user?.role !== 'admin') {
            console.warn("   Admin authorization failed.");
            return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
        }
        console.log(`   Admin User ID: ${session.user.id}`);

        console.log("2. Connecting to DB...");
        await connectToDatabase();
        console.log("   DB Connected.");

        console.log("3. Fetching all bookings with population...");
        // Mongoose sẽ biết về 'Schedule' và 'User' nhờ các lệnh import ở trên
        const bookings = await TicketBooking.find()
            .populate<{ scheduleId: { eventName: string; date: Date } }>({
                path: 'scheduleId',
                model: Schedule,
                select: 'eventName date' // Chỉ lấy các trường cần thiết
            })
            .populate<{ userId: { fullName?: string; email: string } }>({
                path: 'userId',
                model: User,
                select: 'fullName email' // Lấy thông tin người dùng
            })
            .sort({ createdAt: -1 }); // Sắp xếp mới nhất lên đầu
        console.log(`   Found ${bookings.length} bookings.`);

        console.log("4. Returning bookings list...");
        return NextResponse.json(bookings);

    } catch (error) {
        console.error('--- [API ERROR] GET /api/ticket-booking: ---', error);
        if (error instanceof mongoose.Error.MissingSchemaError) {
            // Lỗi này xảy ra nếu model Schedule hoặc User chưa được import đúng cách
            console.error("   --- SCHEMA ERROR ---: Model '" + error.message.split('"')[1] + "' has not been registered. Ensure it is imported in this API route file.");
        }
        return NextResponse.json({ error: 'Error fetching ticket bookings', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}

// === DELETE: Xóa một lượt đặt vé (cho admin) ===
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    console.log("--- [API] DELETE /api/ticket-booking/[id] (Admin Delete Attempt) ---");
    try {
        const { id } = params;

        // 1. Kiểm tra ID hợp lệ
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            console.error("   Validation Error: Invalid ticket booking ID format.");
            return NextResponse.json({ error: 'Invalid ticket booking ID format' }, { status: 400 });
        }

        // 2. Xác thực quyền admin
        const session = await getServerSession(adminAuthOptions);
        if (!session || session.user?.role !== 'admin') {
            console.warn("   Admin authorization failed.");
            return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
        }
        console.log(`   Admin User ID: ${session.user.id}`);

        // 3. Kết nối Database
        await connectToDatabase();

        // 4. Tìm và xóa đặt vé
        const deletedBooking = await TicketBooking.findByIdAndDelete(id);
        if (!deletedBooking) {
            console.error(`   Ticket booking with ID ${id} not found.`);
            return NextResponse.json({ error: 'Ticket booking not found' }, { status: 404 });
        }

        console.log(`   Successfully deleted booking with ID: ${id}`);
        return NextResponse.json({ 
            success: true, 
            message: 'Ticket booking deleted successfully',
            deletedId: deletedBooking._id
        });

    } catch (error: any) {
        console.error('--- [API ERROR] DELETE /api/ticket-booking/[id]: ---', error);
        if (error.name === 'CastError' && error.path === '_id') {
            return NextResponse.json({ error: 'Invalid ticket booking ID format' }, { status: 400 });
        }
        return NextResponse.json({ 
            error: 'Error deleting ticket booking', 
            details: error.message 
        }, { status: 500 });
    }
}