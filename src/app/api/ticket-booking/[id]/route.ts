// /app/api/ticket-booking/[id]/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import TicketBooking from '@/lib/models/TicketBooking';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { adminAuthOptions } from '@/lib/adminAuth'; // Dùng auth của admin

export const runtime = 'nodejs';

// PUT: Cập nhật trạng thái đặt vé
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        // Xác thực admin
        const session = await getServerSession(adminAuthOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Kiểm tra ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid booking ID format' }, { status: 400 });
        }

        // Lấy dữ liệu status mới từ body (dạng JSON)
        const { status } = await request.json();

        // Kiểm tra xem status có hợp lệ không
        const validStatuses = ['pending', 'confirmed', 'cancelled'];
        if (!status || !validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
        }

        await connectToDatabase();

        // Tìm và cập nhật chỉ trường status
        const updatedBooking = await TicketBooking.findByIdAndUpdate(
            id,
            { $set: { status: status } },
            { new: true, runValidators: true }
        )
            .populate('scheduleId', 'eventName date') // Populate lại để trả về đủ thông tin
            .populate('userId', 'name email');

        if (!updatedBooking) {
            return NextResponse.json({ error: 'Ticket booking not found' }, { status: 404 });
        }

        return NextResponse.json(updatedBooking);

    } catch (error: any) {
        console.error('Error updating ticket booking status:', error);
        if (error.name === 'ValidationError') {
            return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Error updating ticket booking status', details: error.message }, { status: 500 });
    }
}

// DELETE: Xóa đặt vé
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        // Xác thực admin
        const session = await getServerSession(adminAuthOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Kiểm tra ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid booking ID format' }, { status: 400 });
        }

        await connectToDatabase();

        const deletedBooking = await TicketBooking.findByIdAndDelete(id);

        if (!deletedBooking) {
            return NextResponse.json({ error: 'Ticket booking not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Ticket booking deleted successfully' });

    } catch (error: any) {
        console.error('Error deleting ticket booking:', error);
        return NextResponse.json({ error: 'Error deleting ticket booking', details: error.message }, { status: 500 });
    }
}