import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Schedule, { ISchedule } from '@/lib/models/Schedule'; // Import model Schedule và Interface
import mongoose from 'mongoose'; // Import mongoose để kiểm tra ObjectId hợp lệ

export const runtime = 'nodejs'; // Chỉ định runtime cho Vercel/Next.js

// --- HÀM GET ĐỂ LẤY CHI TIẾT LỊCH TRÌNH ---
// (Giữ nguyên như cũ, không cần sửa)
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Định dạng ID lịch trình không hợp lệ' }, { status: 400 });
    }
    await connectToDatabase();
    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return NextResponse.json({ error: 'Không tìm thấy lịch trình' }, { status: 404 });
    }
    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Error fetching schedule detail:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi lấy chi tiết lịch trình' }, { status: 500 });
  }
}

// --- HÀM PUT ĐỂ CẬP NHẬT LỊCH TRÌNH (CHO ADMIN) ---
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // 1. Kiểm tra ID hợp lệ
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Định dạng ID lịch trình không hợp lệ' }, { status: 400 });
    }

    // 2. Kết nối Database
    await connectToDatabase();

    // === THAY ĐỔI: Đọc body dưới dạng JSON ===
    const jsonData = await request.json();
    // === KẾT THÚC THAY ĐỔI ===


    // 3. Destructure các trường cần cập nhật từ jsonData
    const {
      eventName,
      description,
      date,
      startTime,
      endTime,
      venue,
      type,
      status,
      price // Thêm price
    } = jsonData;


    // 4. Chuẩn bị object chứa các trường cần cập nhật ($set)
    const updateFields: { [key: string]: any } = {};

    // Chỉ thêm vào updateFields những trường thực sự được gửi lên trong request
    if (eventName !== undefined) updateFields.eventName = eventName;
    if (description !== undefined) updateFields.description = description; // Cho phép gửi description rỗng để xóa
    if (startTime !== undefined) updateFields.startTime = startTime;
    updateFields.endTime = endTime; // Cho phép gửi endTime là null hoặc undefined hoặc giá trị mới
    if (venue !== undefined) updateFields.venue = venue; // Cập nhật cả object venue
    if (type !== undefined) updateFields.type = type;
    if (status !== undefined) updateFields.status = status;

    // Xử lý date nếu có gửi lên
    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: 'Định dạng ngày không hợp lệ' }, { status: 400 });
      }
      updateFields.date = parsedDate;
    }

    // Xử lý price nếu có gửi lên
    if (price !== undefined) {
      if (price === null || price === '') {
        updateFields.price = undefined; // Cho phép xóa giá (set về undefined/null trong DB)
      } else {
        const numPrice = Number(price);
        if (isNaN(numPrice) || numPrice < 0) {
          return NextResponse.json({ error: 'Giá vé không hợp lệ (phải là số không âm)' }, { status: 400 });
        }
        updateFields.price = numPrice;
      }
    }


    // 5. Tìm và Cập nhật lịch trình trong DB
    // Sử dụng findByIdAndUpdate với $set để chỉ cập nhật các trường được cung cấp
    const updatedSchedule = await Schedule.findByIdAndUpdate(
      id,
      { $set: updateFields }, // Chỉ cập nhật các trường trong updateFields
      { new: true, runValidators: true } // new: trả về document đã update, runValidators: chạy schema validation
    );

    // 6. Xử lý nếu không tìm thấy để cập nhật
    if (!updatedSchedule) {
      return NextResponse.json({ error: 'Không tìm thấy lịch trình để cập nhật' }, { status: 404 });
    }

    // 7. Trả về lịch trình đã được cập nhật
    return NextResponse.json(updatedSchedule);

  } catch (error: any) { // Bắt lỗi cụ thể
    console.error('Error updating schedule:', error);
    if (error instanceof SyntaxError) { // Lỗi nếu JSON gửi lên không hợp lệ
      return NextResponse.json({ error: 'Dữ liệu JSON không hợp lệ' }, { status: 400 });
    }
    // Xử lý lỗi validation từ Mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val: any) => val.message);
      return NextResponse.json({ error: 'Validation thất bại', details: messages }, { status: 400 });
    }
    return NextResponse.json({ error: 'Lỗi máy chủ nội bộ khi cập nhật lịch trình' }, { status: 500 });
  }
}

// --- HÀM DELETE ĐỂ XÓA LỊCH TRÌNH (CHO ADMIN) ---
// (Giữ nguyên như cũ, không cần sửa)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Định dạng ID lịch trình không hợp lệ' }, { status: 400 });
    }
    await connectToDatabase();
    const deletedSchedule = await Schedule.findByIdAndDelete(id);
    if (!deletedSchedule) {
      return NextResponse.json({ error: 'Không tìm thấy lịch trình để xóa' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Xóa lịch trình thành công' }); // Message rõ ràng hơn
  } catch (error: any) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi xóa lịch trình' }, { status: 500 });
  }
}