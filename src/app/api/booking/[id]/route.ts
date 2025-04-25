// /app/api/booking/[id]/route.js
import { NextResponse } from 'next/server';
// Sử dụng connectToDatabase từ lib/mongodb giống như schedule
import { connectToDatabase } from '@/lib/mongodb';
import Booking from '@/lib/models/Booking'; // Import model Booking mới
import { getServerSession } from 'next-auth';
import { adminAuthOptions } from '@/lib/adminAuth'; // Giả sử bạn dùng cái này để check admin

export const runtime = 'nodejs'; // Quan trọng nếu dùng Mongoose

// PUT: Cập nhật booking từ FormData
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Kiểm tra session admin nếu cần bảo vệ endpoint này
    const session = await getServerSession(adminAuthOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const formData = await request.formData();

    // Lấy dữ liệu từ FormData và chuẩn bị object updateData
    const updateData: Record<string, any> = {};
    formData.forEach((value, key) => {
      if (key === 'eventDate') {
        updateData[key] = value ? new Date(value as string) : undefined;
      } else if (key === 'duration' || key === 'expectedGuests') {
        updateData[key] = value ? parseInt(value as string, 10) : undefined;
      } else if (key === 'budget') {
        updateData[key] = value ? parseFloat(value as string) : undefined;
      } else if (key === 'requirements' && value === '') {
        // Cho phép xóa requirements bằng cách gửi chuỗi rỗng
        updateData[key] = undefined; // Hoặc bạn có thể set là '' tùy vào logic schema/app
      }
      else {
        updateData[key] = value as string;
      }
    });

    // Xử lý các trường có thể không có trong FormData nhưng cần được set là undefined nếu rỗng
    if (!formData.has('requirements')) updateData.requirements = undefined;
    if (!formData.has('budget')) updateData.budget = undefined;

    // Kiểm tra ngày hợp lệ sau khi chuyển đổi
    if (updateData.eventDate && isNaN(updateData.eventDate.getTime())) {
      return NextResponse.json({ error: 'Ngày sự kiện không hợp lệ' }, { status: 400 });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true } // new: true trả về document đã update, runValidators: true để chạy validate của schema
    );

    if (!updatedBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json(updatedBooking);

  } catch (error: any) {
    console.error('Error updating booking:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ', details: error.errors }, { status: 400 });
    }
    if (error.name === 'CastError' && error.path === '_id') {
      return NextResponse.json({ error: 'Booking ID không hợp lệ' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Lỗi khi cập nhật đặt lịch', details: error.message }, { status: 500 });
  }
}

// DELETE: Xóa booking
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Kiểm tra session admin nếu cần bảo vệ endpoint này
    const session = await getServerSession(adminAuthOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const deletedBooking = await Booking.findByIdAndDelete(id);

    if (!deletedBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting booking:', error);
    if (error.name === 'CastError' && error.path === '_id') {
      return NextResponse.json({ error: 'Booking ID không hợp lệ' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Lỗi khi xóa đặt lịch', details: error.message }, { status: 500 });
  }
}