import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Booking from '@/lib/models/Booking';
import { getServerSession } from 'next-auth';
import { adminAuthOptions } from '@/lib/adminAuth';

export async function GET() {
  try {
    const session = await getServerSession(adminAuthOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const bookings = await Booking.find()
      .populate('userId', 'name email');
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Lỗi khi lấy danh sách đặt lịch' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(adminAuthOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const data = await req.json();

    // Kiểm tra dữ liệu bắt buộc
    if (!data.eventName || !data.eventDate || !data.location) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    // Tạo booking mới
    const booking = await Booking.create({
      ...data,
      userId: session.user.id
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Lỗi khi tạo đặt lịch' },
      { status: 500 }
    );
  }
}