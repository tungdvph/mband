import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/lib/models/User';
import Booking from '@/lib/models/Booking';
import Song from '@/lib/models/Music';
import Contact from '@/lib/models/Contact';

export async function GET() {
    try {
        await connectToDatabase();

        const [users, bookings, songs, contacts] = await Promise.all([
            User.countDocuments(),
            Booking.countDocuments(),
            Song.countDocuments(),
            Contact.countDocuments()
        ]);

        return NextResponse.json({
            users,
            bookings,
            songs,
            contacts
        });
    } catch (error) {
        console.error('Stats error:', error);
        return NextResponse.json({ error: 'Lỗi khi lấy thống kê' }, { status: 500 });
    }
}