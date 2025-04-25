// /app/api/ticket-booking/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import TicketBooking from '@/lib/models/TicketBooking';
import { getServerSession } from 'next-auth';
import { adminAuthOptions } from '@/lib/adminAuth'; // Dùng auth của admin

export const runtime = 'nodejs';

export async function GET() {
    try {
        // Xác thực admin
        const session = await getServerSession(adminAuthOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        // Lấy danh sách đặt vé, populate thông tin schedule và user
        const bookings = await TicketBooking.find()
            .populate({
                path: 'scheduleId',
                select: 'eventName date' // Chỉ lấy các trường cần thiết từ Schedule
            })
            .populate({
                path: 'userId',
                // --- ĐÃ SỬA Ở ĐÂY ---
                select: 'fullName email' // Lấy fullName và email từ User
            })
            .sort({ createdAt: -1 }); // Sắp xếp mới nhất lên đầu

        return NextResponse.json(bookings);

    } catch (error) {
        console.error('Error fetching ticket bookings:', error);
        return NextResponse.json({ error: 'Error fetching ticket bookings' }, { status: 500 });
    }
}