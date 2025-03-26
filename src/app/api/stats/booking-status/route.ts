import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Booking from '@/lib/models/Booking';

export async function GET() {
    try {
        await connectToDatabase();
        
        const [confirmed, pending, cancelled] = await Promise.all([
            Booking.countDocuments({ status: 'confirmed' }),
            Booking.countDocuments({ status: 'pending' }),
            Booking.countDocuments({ status: 'cancelled' })
        ]);

        return NextResponse.json({
            confirmed,
            pending,
            cancelled
        });
    } catch (error) {
        console.error('Booking status stats error:', error);
        return NextResponse.json({ error: 'Lỗi khi lấy thống kê trạng thái đặt lịch' }, { status: 500 });
    }
}