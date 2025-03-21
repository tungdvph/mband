import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Booking from '@/lib/models/Booking';

// GET all bookings
export async function GET() {
  try {
    await connectDB();
    const bookings = await Booking.find()
      .populate('userId', 'name email')
      .populate('eventId');
    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST new booking
export async function POST(req: Request) {
  try {
    await connectDB();
    const data = await req.json();
    const booking = await Booking.create(data);
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}