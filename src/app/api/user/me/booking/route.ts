// /app/api/users/me/booking/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import TicketBooking, { ITicketBooking } from '@/lib/models/TicketBooking';
import { getServerSession } from 'next-auth';
import { publicAuthOptions } from '@/lib/publicAuth';
import Schedule, { ISchedule } from '@/lib/models/Schedule';
import mongoose, { Types } from 'mongoose';

export const runtime = 'nodejs';

// --- Interfaces (Giữ nguyên) ---
interface PopulatedScheduleInfo {
    _id: Types.ObjectId | string;
    eventName?: string;
    date?: Date | string;
    price?: number;
}

interface PopulatedBooking {
    _id: Types.ObjectId | string; // Kiểu này vẫn đúng
    userId: Types.ObjectId | string;
    scheduleId: PopulatedScheduleInfo | null;
    ticketCount: number;
    status: 'pending' | 'confirmed' | 'cancelled';
    totalPrice?: number;
    createdAt: Date | string; // Đảm bảo ITicketBooking cũng có
    updatedAt: Date | string; // Đảm bảo ITicketBooking cũng có
}

function isSchedulePopulated(
    schedule: PopulatedScheduleInfo | Types.ObjectId | null | undefined
): schedule is PopulatedScheduleInfo {
    return typeof schedule === 'object' && schedule !== null && 'price' in schedule;
}


export async function GET(request: Request) {
    console.log("--- GET /api/user/me/booking START ---");
    try {
        console.log("1. Getting session...");
        const session = await getServerSession(publicAuthOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const loggedInUserId = session.user.id;
        console.log(`   User ID: ${loggedInUserId}`);

        console.log("2. Connecting to DB...");
        await connectToDatabase();
        console.log("   DB Connected.");

        console.log("3. Finding bookings for user...");

        // Khai báo rõ ràng kiểu dữ liệu là mảng PopulatedBooking[]
        const bookings = await TicketBooking.find({ userId: loggedInUserId })
            .populate({
                path: 'scheduleId',
                model: Schedule,
                select: 'eventName date price'
            })
            .sort({ createdAt: -1 })
            .lean();

        // Ép kiểu nếu muốn chắc chắn
        // const bookings = (await TicketBooking.find(...).lean()) as PopulatedBooking[];

        // Kiểu của 'bookings' bây giờ sẽ được suy luận là any[], bạn có thể ép kiểu nếu cần

        console.log(`   Found ${bookings.length} bookings.`);

        // Phần còn lại của logic không đổi
        if (bookings.length > 0) {
            const firstBooking = bookings[0];
            console.log("   Example booking data (after populate & lean):", JSON.stringify(firstBooking, null, 2));
            // Kiểm tra kiểu thực tế của _id nếu cần debug
            // console.log("   Type of _id:", typeof firstBooking._id, firstBooking._id instanceof Types.ObjectId);
            console.log("   Does example booking have totalPrice?", firstBooking?.hasOwnProperty('totalPrice'));

            if (isSchedulePopulated(firstBooking.scheduleId)) {
                const price = (firstBooking.scheduleId as PopulatedScheduleInfo).price;
                console.log("   Schedule price from populate (safe access):", price);
            } else {
                console.warn(`   Schedule price not accessible for booking ID: ${firstBooking._id}. scheduleId:`, firstBooking.scheduleId);
            }
        }

        console.log("4. Returning JSON response...");
        // Trả về dữ liệu bookings đã được định kiểu đúng
        return NextResponse.json(bookings);

    } catch (error) {
        console.error('--- DETAILED ERROR in GET /api/user/me/booking: ---', error);
        const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định khi lấy lịch sử đặt vé';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}