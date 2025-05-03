import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Schedule, { ISchedule } from '@/lib/models/Schedule'; // Import model và có thể cả Interface nếu cần

export const runtime = 'nodejs'; // Chỉ định runtime

// --- HÀM GET ĐỂ LẤY DANH SÁCH LỊCH TRÌNH ---
export async function GET() {
  try {
    await connectToDatabase();
    // Sắp xếp theo ngày gần nhất -> xa nhất, cùng ngày thì theo giờ bắt đầu sớm -> muộn
    const schedules = await Schedule.find({}).sort({ date: -1, startTime: 1 });
    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ nội bộ khi lấy lịch trình' }, { status: 500 });
  }
}

// --- HÀM POST ĐỂ TẠO LỊCH TRÌNH MỚI (CHO ADMIN) ---
export async function POST(request: Request) {
  try {
    await connectToDatabase();

    // === THAY ĐỔI: Đọc body dưới dạng JSON ===
    const jsonData = await request.json();
    // === KẾT THÚC THAY ĐỔI ===

    // === CẬP NHẬT: Lấy dữ liệu từ object jsonData ===
    // Destructure để lấy các trường, bao gồm cả price
    const {
      eventName,
      description,
      date, // Frontend gửi string date (ví dụ: "YYYY-MM-DD")
      startTime,
      endTime,
      venue, // Frontend gửi object venue: { name, address, city }
      type,
      status,
      price // Frontend gửi string hoặc number, hoặc undefined/null
    } = jsonData;
    // === KẾT THÚC CẬP NHẬT ===


    // --- Validation (Cần chi tiết hơn) ---
    if (!eventName || !date || !startTime || !venue?.name || !venue?.address || !venue?.city || !type) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    // Chuẩn bị dữ liệu để lưu, chuyển đổi kiểu nếu cần
    const scheduleData: Partial<ISchedule> = { // Sử dụng Partial<ISchedule> để linh hoạt
      eventName,
      description: description || undefined, // Nếu không có description thì là undefined
      startTime,
      endTime: endTime || undefined, // Nếu không có endTime thì là undefined
      venue,
      type,
      status: status || 'scheduled', // Mặc định là 'scheduled' nếu không có
    };

    // Xử lý và validate date
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: 'Định dạng ngày không hợp lệ' }, { status: 400 });
    }
    scheduleData.date = parsedDate; // Lưu đối tượng Date

    // Xử lý và validate price
    if (price !== undefined && price !== null && price !== '') {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) {
        return NextResponse.json({ error: 'Giá vé không hợp lệ (phải là số không âm)' }, { status: 400 });
      }
      scheduleData.price = numPrice; // Lưu giá trị số
    } else {
      scheduleData.price = undefined; // Hoặc 0 tùy logic, undefined có vẻ phù hợp với optional
    }
    // --- Kết thúc Validation & Chuẩn bị dữ liệu ---


    // Tạo và lưu lịch trình mới
    const newSchedule = new Schedule(scheduleData);
    await newSchedule.save(); // .save() sẽ tự chạy validation của Mongoose Schema

    return NextResponse.json(newSchedule, { status: 201 }); // Trả về 201 Created và document mới

  } catch (error: any) { // Bắt lỗi cụ thể hơn
    console.error('Error creating schedule:', error);
    if (error instanceof SyntaxError) { // Lỗi nếu JSON gửi lên không hợp lệ
      return NextResponse.json({ error: 'Dữ liệu JSON không hợp lệ' }, { status: 400 });
    }
    // Xử lý lỗi validation từ Mongoose
    if (error.name === 'ValidationError') {
      // Lấy thông điệp lỗi rõ ràng hơn từ Mongoose
      const messages = Object.values(error.errors).map((val: any) => val.message);
      return NextResponse.json({ error: 'Validation thất bại', details: messages }, { status: 400 });
    }
    return NextResponse.json({ error: 'Lỗi máy chủ nội bộ khi tạo lịch trình' }, { status: 500 });
  }
}