import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import TicketBooking from '@/lib/models/TicketBooking';
import Schedule from '@/lib/models/Schedule';
import User from '@/lib/models/User';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { adminAuthOptions } from '@/lib/adminAuth';
import { publicAuthOptions } from '@/lib/publicAuth'; // Thêm import này

// Thêm interface ISchedule
interface ISchedule {
  _id: mongoose.Types.ObjectId;
  price: number;  // Thay ticketPrice bằng price để khớp với cách sử dụng trong code
  // ... các trường khác nếu cần
}

// Khuyến nghị sử dụng runtime Node.js khi làm việc với cơ sở dữ liệu Mongoose truyền thống
export const runtime = 'nodejs';

// === POST: Tạo mới một lượt đặt vé ===
// (Giả sử hàm này giữ nguyên như ban đầu bạn cung cấp, nếu có thay đổi bạn cần cập nhật)
export async function POST(request: Request) {
    try {
        await connectToDatabase();
        const body = await request.json();
        const { scheduleId, ticketCount, paymentMethod, cardNumber, expiryDate, cvv, fullName, email, phoneNumber } = body;

        // Lấy userId từ session
        const session = await getServerSession(publicAuthOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;

        // Tính toán totalPrice dựa trên giá vé và số lượng
        const schedule = await Schedule.findById(scheduleId).lean<ISchedule>();
        if (!schedule) {
            console.error(`   Schedule with ID ${scheduleId} not found.`);
            return NextResponse.json({ error: 'Schedule not found or has been removed.' }, { status: 404 });
        }

        // Kiểm tra và đảm bảo schedule.price là số hợp lệ
        const pricePerTicket = typeof schedule.price === 'number' && !isNaN(schedule.price) ? schedule.price : 100000;
        const calculatedTotalPrice = ticketCount * pricePerTicket;

        // Validate dữ liệu đầu vào
        if (!scheduleId || !ticketCount) {
            console.error("Validation Error: Missing scheduleId or ticketCount.");
            return NextResponse.json({ error: 'Missing schedule ID or ticket count' }, { status: 400 });
        }

        if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
            console.error("Validation Error: Invalid scheduleId format.");
            return NextResponse.json({ error: 'Invalid schedule ID format' }, { status: 400 });
        }

        if (typeof ticketCount !== 'number' || ticketCount < 1) {
            console.error("Validation Error: Invalid ticketCount.");
            return NextResponse.json({ error: 'Invalid ticket count' }, { status: 400 });
        }

        // Validate payment information
        if (paymentMethod !== 'cod') {
            if (!cardNumber || !expiryDate || !cvv) {
                return NextResponse.json({ error: 'Payment information is required for non-COD methods' }, { status: 400 });
            }
        }

        // Validate contact information
        if (!fullName || !email || !phoneNumber) {
            return NextResponse.json({ error: 'Contact information is required' }, { status: 400 });
        }

        const newBooking = new TicketBooking({
            scheduleId,
            userId,
            ticketCount,
            totalPrice: calculatedTotalPrice, // Sử dụng giá đã tính toán
            status: 'pending',
            seatInfo: '' // Thêm seatInfo nếu cần
        });

        await newBooking.save();

        const populatedBooking = await TicketBooking.findById(newBooking._id)
            .populate({ path: 'scheduleId', model: Schedule, select: 'eventName date' })
            .populate({ path: 'userId', model: User, select: 'fullName email' });

        return NextResponse.json(populatedBooking, { status: 201 });

    } catch (error: any) {
        console.error('Error creating ticket booking:', error);
        if (error.name === 'ValidationError') {
            return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Error creating ticket booking', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}


// === GET: Lấy danh sách tất cả lượt đặt vé (cho admin) ===
export async function GET() {
    try {
        // Xác thực quyền admin
        const session = await getServerSession(adminAuthOptions);
        if (!session || session.user?.role !== 'admin') { // Kiểm tra thêm role nếu có
            return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
        }

        await connectToDatabase();

        // Mongoose sẽ biết về 'Schedule' và 'User' nhờ các lệnh import ở trên
        const bookings = await TicketBooking.find()
            .populate<{ scheduleId: { eventName: string; date: Date } }>({ // Thêm kiểu dữ liệu cho populate
                path: 'scheduleId',
                model: Schedule, // Chỉ định model tường minh (tùy chọn nhưng tốt)
                select: 'eventName date' // Chỉ lấy các trường cần thiết từ Schedule
            })
            .populate<{ userId: { fullName?: string; email: string } }>({ // Thêm kiểu dữ liệu cho populate
                path: 'userId',
                model: User, // Chỉ định model tường minh (tùy chọn nhưng tốt)
                select: 'fullName email' // Lấy fullName và email từ User
            })
            .sort({ createdAt: -1 }); // Sắp xếp mới nhất lên đầu

        return NextResponse.json(bookings);

    } catch (error) {
        console.error('Error fetching ticket bookings:', error);
        // Ghi log chi tiết hơn nếu là lỗi schema
        if (error instanceof mongoose.Error.MissingSchemaError) {
            console.error("--- LỖI SCHEMA ---: Model '" + error.message.split('"')[1] + "' chưa được đăng ký. Hãy đảm bảo bạn đã import model này trong file API route này.");
        }
        return NextResponse.json({ error: 'Error fetching ticket bookings', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
