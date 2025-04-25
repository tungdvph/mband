// /src/app/api/schedule/[id]/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb'; // Đảm bảo import đúng hàm kết nối DB
import Schedule from '@/lib/models/Schedule'; // Import model Schedule
import mongoose from 'mongoose'; // Import mongoose để kiểm tra ObjectId hợp lệ

export const runtime = 'nodejs'; // Chỉ định runtime cho Vercel/Next.js

// --- HÀM GET ĐỂ LẤY CHI TIẾT LỊCH TRÌNH ---
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // 1. Kiểm tra xem id có phải là ObjectId hợp lệ không
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid schedule ID format' }, { status: 400 });
    }

    // 2. Kết nối Database
    await connectToDatabase();

    // 3. Tìm lịch trình bằng ID
    const schedule = await Schedule.findById(id);

    // 4. Xử lý nếu không tìm thấy
    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // 5. Trả về dữ liệu lịch trình tìm được
    return NextResponse.json(schedule);

  } catch (error) {
    console.error('Error fetching schedule detail:', error);
    return NextResponse.json({ error: 'Server error while fetching schedule detail' }, { status: 500 });
  }
}

// --- HÀM PUT ĐỂ CẬP NHẬT LỊCH TRÌNH (CHO ADMIN) ---
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // 1. Kiểm tra ID hợp lệ
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid schedule ID format' }, { status: 400 });
    }

    // 2. Kết nối Database
    await connectToDatabase();

    // 3. Lấy dữ liệu từ FormData
    const formData = await request.formData();
    const updateData: { [key: string]: any } = {}; // Khởi tạo object để chứa dữ liệu cập nhật

    // 4. Xử lý các trường dữ liệu từ FormData
    // Dùng vòng lặp để linh hoạt hơn hoặc lấy từng trường
    updateData.eventName = formData.get('eventName'); // Lấy eventName (thay vì title)
    updateData.description = formData.get('description');
    updateData.startTime = formData.get('startTime');
    updateData.endTime = formData.get('endTime') || null; // Nếu endTime rỗng thì đặt là null hoặc bỏ qua
    updateData.type = formData.get('type');
    updateData.status = formData.get('status');

    // Xử lý trường date
    const dateString = formData.get('date') as string;
    if (dateString) {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) { // Kiểm tra ngày hợp lệ
        updateData.date = date;
      } else {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
      }
    }

    // Xử lý đối tượng venue lồng nhau
    const venueName = formData.get('venueName');
    const venueAddress = formData.get('venueAddress');
    const venueCity = formData.get('venueCity');
    if (venueName || venueAddress || venueCity) {
      updateData.venue = {
        name: venueName,
        address: venueAddress,
        city: venueCity
      };
    }

    // 5. Tìm và Cập nhật lịch trình trong DB
    const updatedSchedule = await Schedule.findByIdAndUpdate(
      id,
      { $set: updateData }, // Chỉ cập nhật các trường có trong updateData
      { new: true, runValidators: true } // new: trả về document đã update, runValidators: chạy schema validation
    );

    // 6. Xử lý nếu không tìm thấy để cập nhật
    if (!updatedSchedule) {
      return NextResponse.json({ error: 'Schedule not found for update' }, { status: 404 });
    }

    // 7. Trả về lịch trình đã được cập nhật
    return NextResponse.json(updatedSchedule);

  } catch (error: any) {
    console.error('Error updating schedule:', error);
    // Xử lý lỗi validation từ Mongoose
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error while updating schedule', details: error.message }, { status: 500 });
  }
}

// --- HÀM DELETE ĐỂ XÓA LỊCH TRÌNH (CHO ADMIN) ---
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // 1. Kiểm tra ID hợp lệ
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid schedule ID format' }, { status: 400 });
    }

    // 2. Kết nối Database
    await connectToDatabase();

    // 3. Tìm và Xóa lịch trình bằng ID
    const deletedSchedule = await Schedule.findByIdAndDelete(id);

    // 4. Xử lý nếu không tìm thấy để xóa
    if (!deletedSchedule) {
      return NextResponse.json({ error: 'Schedule not found for deletion' }, { status: 404 });
    }

    // 5. Trả về thông báo thành công
    return NextResponse.json({ success: true, message: 'Schedule deleted successfully' });

  } catch (error: any) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json({ error: 'Server error while deleting schedule', details: error.message }, { status: 500 });
  }
}