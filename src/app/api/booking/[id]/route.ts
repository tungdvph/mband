import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Booking from '@/lib/models/Booking';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const data = await request.json();
    const updatedBooking = await Booking.findByIdAndUpdate(
      params.id,
      { $set: data },
      { new: true }
    );
    return NextResponse.json(updatedBooking);
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi khi cập nhật đặt lịch' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    await Booking.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi khi xóa đặt lịch' }, { status: 500 });
  }
}