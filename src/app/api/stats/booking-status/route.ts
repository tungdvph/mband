// File: /app/api/stats/booking-status/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import TicketBooking from '@/lib/models/TicketBooking';

export async function GET() {
    try {
        await connectToDatabase();

        // Đếm số lượng cho mỗi trạng thái từ TicketBooking model
        const [confirmed, pending, cancelled, delivered] = await Promise.all([
            TicketBooking.countDocuments({ status: 'confirmed' }),
            TicketBooking.countDocuments({ status: 'pending' }),
            TicketBooking.countDocuments({ status: 'cancelled' }),
            TicketBooking.countDocuments({ status: 'delivered' }) // Đếm thêm trạng thái 'delivered'
        ]);

        // Trả về dữ liệu bao gồm cả trạng thái 'delivered'
        return NextResponse.json({
            confirmed,
            pending,
            cancelled,
            delivered // Thêm delivered vào response
        });

    } catch (error) {
        console.error('Error fetching ticket booking status stats:', error);
        return NextResponse.json(
            { error: 'Lỗi khi lấy thống kê trạng thái đặt vé' },
            { status: 500 }
        );
    }
}