// /app/api/booking/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import BookingRequest, { IBookingRequest } from '@/lib/models/BookingRequest'; // Import interface từ file model
import { getServerSession } from 'next-auth';
// import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Đường dẫn tới file auth options
// import { adminAuthOptions } from '@/lib/adminAuth'; // Nếu bạn có admin auth riêng

export const runtime = 'nodejs';

// GET: Lấy tất cả các yêu cầu đặt lịch
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Ví dụ: Kiểm tra session admin nếu cần bảo vệ endpoint này
    // const session = await getServerSession(adminAuthOptions);
    // if (!session || !session.user.isAdmin) { // Giả sử có trường isAdmin trong user session
    //     return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    // }

    await connectToDatabase();
    const bookingRequests = await BookingRequest.find().sort({ createdAt: -1 });
    return NextResponse.json(bookingRequests);
  } catch (error: any) {
    console.error('Error fetching booking requests:', error);
    return NextResponse.json({ error: 'Lỗi khi lấy danh sách yêu cầu đặt lịch', details: error.message }, { status: 500 });
  }
}

// POST: Tạo yêu cầu đặt lịch mới
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Lấy session của người dùng hiện tại để lưu userId (nếu cần)
    // Giả sử authOptions là cấu hình NextAuth của bạn
    // const userSession = await getServerSession(authOptions);

    // if (!userSession?.user?.id) { // Bắt buộc đăng nhập để đặt
    //     return NextResponse.json({ error: 'Bạn cần đăng nhập để thực hiện hành động này.' }, { status: 401 });
    // }

    await connectToDatabase();
    const formData = await request.formData();

    const eventDateRaw = formData.get('eventDate') as string;
    const durationRaw = formData.get('duration') as string;
    const expectedGuestsRaw = formData.get('expectedGuests') as string;
    const budgetRaw = formData.get('budget') as string;

    // Tạo Partial<IBookingRequest> để xây dựng đối tượng một cách an toàn
    // Omit các trường do DB quản lý hoặc có default và không nên nhận từ client khi tạo mới
    const bookingRequestData: Partial<Omit<IBookingRequest, '_id' | 'createdAt' | 'updatedAt' | 'status'>> = {
      eventName: formData.get('eventName') as string,
      location: formData.get('location') as string,
      eventType: formData.get('eventType') as IBookingRequest['eventType'],
      requirements: (formData.get('requirements') as string) || '',
      contactName: formData.get('contactName') as string,
      contactPhone: formData.get('contactPhone') as string,
      contactEmail: formData.get('contactEmail') as string,
      // userId: userSession.user.id as any, // Gán userId từ session, ép kiểu nếu cần
    };

    if (eventDateRaw) {
      const parsedDate = new Date(eventDateRaw);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: 'Ngày sự kiện không hợp lệ. Định dạng mong muốn YYYY-MM-DDTHH:mm' }, { status: 400 });
      }
      bookingRequestData.eventDate = parsedDate;
    } else {
      return NextResponse.json({ error: 'Ngày sự kiện là bắt buộc.' }, { status: 400 });
    }

    if (durationRaw) {
      const durationNum = parseFloat(durationRaw);
      if (isNaN(durationNum) || durationNum <= 0) {
        return NextResponse.json({ error: 'Thời lượng không hợp lệ. Phải là số lớn hơn 0.' }, { status: 400 });
      }
      bookingRequestData.duration = durationNum;
    } else {
      return NextResponse.json({ error: 'Thời lượng là bắt buộc.' }, { status: 400 });
    }

    if (expectedGuestsRaw) {
      const guestsNum = parseInt(expectedGuestsRaw, 10);
      if (isNaN(guestsNum) || guestsNum <= 0) {
        return NextResponse.json({ error: 'Số khách dự kiến không hợp lệ. Phải là số nguyên lớn hơn 0.' }, { status: 400 });
      }
      bookingRequestData.expectedGuests = guestsNum;
    } else {
      return NextResponse.json({ error: 'Số khách dự kiến là bắt buộc.' }, { status: 400 });
    }

    if (budgetRaw && budgetRaw.trim() !== '' && budgetRaw !== '0') {
      const budgetNum = parseFloat(budgetRaw);
      if (isNaN(budgetNum) || budgetNum < 0) {
        return NextResponse.json({ error: 'Ngân sách không hợp lệ. Phải là số không âm.' }, { status: 400 });
      }
      bookingRequestData.budget = budgetNum;
    } else if (budgetRaw === '0') {
      bookingRequestData.budget = 0;
    } else {
      bookingRequestData.budget = null; // Hoặc undefined nếu schema không có default là null
    }
    // status sẽ được đặt default bởi schema

    const newBookingRequest = new BookingRequest(bookingRequestData);
    const savedBookingRequest = await newBookingRequest.save();

    return NextResponse.json(savedBookingRequest, { status: 201 });

  } catch (error: any) {
    console.error('Error creating booking request:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message).join('; ');
      return NextResponse.json({ error: `Dữ liệu không hợp lệ: ${messages}`, details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Lỗi máy chủ khi tạo yêu cầu đặt lịch.', details: error.message }, { status: 500 });
  }
}