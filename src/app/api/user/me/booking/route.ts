// /app/api/users/me/bookings/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import TicketBooking from '@/lib/models/TicketBooking'; // Import model
import { getServerSession } from 'next-auth';
import { publicAuthOptions } from '@/lib/publicAuth';
import Schedule from '@/lib/models/Schedule'; // Thêm import này

export const runtime = 'nodejs';

export async function GET(request: Request) {
    console.log("--- GET /api/user/me/booking START ---");
    try {
        console.log("1. Getting session...");
        const session = await getServerSession(publicAuthOptions);
        if (!session?.user?.id) {
            console.log("   Session invalid or missing user ID.");
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const loggedInUserId = session.user.id;
        console.log(`   User ID: ${loggedInUserId}`);

        console.log("2. Connecting to DB...");
        await connectToDatabase();
        console.log("   DB Connected.");

        console.log("3. Finding bookings...");
        const bookings = await TicketBooking.find({ userId: loggedInUserId })
            .populate({
                path: 'scheduleId',
                model: Schedule,
                select: 'eventName date'
            })
            .sort({ createdAt: -1 });
        console.log(`   Found ${bookings.length} bookings.`);

        console.log("4. Returning JSON response...");
        return NextResponse.json(bookings);

    } catch (error) {
        console.error('--- DETAILED ERROR in GET /api/user/me/booking: ---', error);
        return NextResponse.json(
            { error: 'Error fetching your booking history' },
            { status: 500 }
        );
    }
}