// /app/api/booking/route.js
import { NextResponse } from 'next/server';
// Sử dụng connectToDatabase từ lib/mongodb giống như schedule
import { connectToDatabase } from '@/lib/mongodb';
import Booking from '@/lib/models/Booking'; // Import model Booking mới
import { getServerSession } from 'next-auth';
import { adminAuthOptions } from '@/lib/adminAuth'; // Giả sử bạn dùng cái này để check admin

export const runtime = 'nodejs'; // Quan trọng nếu dùng Mongoose

// GET: Lấy tất cả booking (cho admin)
export async function GET() {
  try {
    // Kiểm tra session admin nếu cần bảo vệ endpoint này
    const session = await getServerSession(adminAuthOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    // Không cần populate nếu không có trường ref nào trong schema mới
    const bookings = await Booking.find().sort({ createdAt: -1 });
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Lỗi khi lấy danh sách đặt lịch' }, { status: 500 });
  }
}

// POST: Tạo booking mới từ FormData
export async function POST(request: Request) {
  try {
    // Có thể bỏ qua kiểm tra session ở đây nếu admin page đã được bảo vệ
    // Hoặc giữ lại nếu muốn kiểm tra quyền cụ thể cho việc tạo mới
    // const session = await getServerSession(adminAuthOptions);
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized for creation' }, { status: 401 });
    // }

    await connectToDatabase();
    const formData = await request.formData();

    // Lấy dữ liệu từ FormData
    const eventDateRaw = formData.get('eventDate') as string;
    const durationRaw = formData.get('duration') as string;
    const expectedGuestsRaw = formData.get('expectedGuests') as string;
    const budgetRaw = formData.get('budget') as string;

    const bookingData = {
      eventName: formData.get('eventName') as string,
      // Chuyển đổi date string sang Date object
      eventDate: eventDateRaw ? new Date(eventDateRaw) : undefined,
      location: formData.get('location') as string,
      eventType: formData.get('eventType') as any, // Cần đảm bảo type khớp enum
      // Chuyển đổi số từ string sang number
      duration: durationRaw ? parseInt(durationRaw, 10) : undefined,
      expectedGuests: expectedGuestsRaw ? parseInt(expectedGuestsRaw, 10) : undefined,
      requirements: formData.get('requirements') as string || undefined,
      budget: budgetRaw ? parseFloat(budgetRaw) : undefined,
      status: formData.get('status') as any || 'pending', // Cần đảm bảo type khớp enum
      contactName: formData.get('contactName') as string,
      contactPhone: formData.get('contactPhone') as string,
      contactEmail: formData.get('contactEmail') as string,
      // userId: session?.user?.id // Thêm nếu cần liên kết user từ session
    };

    // Kiểm tra các trường bắt buộc sau khi đã lấy dữ liệu
    if (!bookingData.eventName || !bookingData.eventDate || !bookingData.location || !bookingData.eventType || !bookingData.duration || !bookingData.expectedGuests || !bookingData.contactName || !bookingData.contactPhone || !bookingData.contactEmail) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }
    if (isNaN(bookingData.eventDate.getTime())) {
      return NextResponse.json({ error: 'Ngày sự kiện không hợp lệ' }, { status: 400 });
    }

    const newBooking = new Booking(bookingData);
    const savedBooking = await newBooking.save();

    return NextResponse.json(savedBooking, { status: 201 });

  } catch (error: any) {
    console.error('Error creating booking:', error);
    // Check for validation errors from Mongoose
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Lỗi khi tạo đặt lịch', details: error.message }, { status: 500 });
  }
}