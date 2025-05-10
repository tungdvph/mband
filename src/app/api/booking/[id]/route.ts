// /app/api/booking/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import BookingRequest, { IBookingRequest } from '@/lib/models/BookingRequest'; // Import interface từ file model
import mongoose from 'mongoose';
// import { getServerSession } from 'next-auth';
// import { adminAuthOptions } from '@/lib/adminAuth'; // Nếu bạn có admin auth riêng

export const runtime = 'nodejs';

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && (String(new mongoose.Types.ObjectId(id)) === id);
}

interface RouteParams {
  params: { id: string };
}

// PUT: Cập nhật một yêu cầu đặt lịch
export async function PUT(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { id } = params;

  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: 'ID yêu cầu đặt lịch không hợp lệ.' }, { status: 400 });
  }

  try {
    // Ví dụ: Kiểm tra session admin nếu chỉ admin được phép cập nhật
    // const session = await getServerSession(adminAuthOptions);
    // if (!session || !session.user.isAdmin) {
    //     return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    // }

    await connectToDatabase();
    const formData = await request.formData();
    // Omit các trường không nên cập nhật trực tiếp qua form hoặc do DB quản lý
    const updateData: Partial<Omit<IBookingRequest, '_id' | 'createdAt' | 'updatedAt' | 'userId'>> = {};
    let validationError: string | null = null; // Biến cờ để theo dõi lỗi validation

    formData.forEach((value, key) => {
      if (validationError) return; // Nếu đã có lỗi, không xử lý thêm

      if (value === null || value === undefined) return; // Bỏ qua nếu giá trị không có

      // Type assertion để TypeScript biết key là một trong các thuộc tính của IBookingRequest
      const K = key as keyof typeof updateData;

      switch (K) {
        case 'eventDate':
          const parsedDate = new Date(value as string);
          if (isNaN(parsedDate.getTime())) {
            validationError = 'Ngày sự kiện không hợp lệ.';
            return;
          }
          updateData.eventDate = parsedDate;
          break;
        case 'duration':
        case 'expectedGuests':
          const numVal = K === 'duration' ? parseFloat(value as string) : parseInt(value as string, 10);
          if (isNaN(numVal) || numVal <= 0) {
            validationError = `${K === 'duration' ? 'Thời lượng' : 'Số khách dự kiến'} không hợp lệ.`;
            return;
          }
          (updateData[K] as number) = numVal; // Gán giá trị đã được kiểm tra kiểu
          break;
        case 'budget':
          if (value === '' || value === '0') { // Nếu gửi rỗng hoặc '0', coi như muốn xóa/set null/0
            updateData.budget = (value === '0' ? 0 : null);
          } else {
            const budgetNum = parseFloat(value as string);
            if (isNaN(budgetNum) || budgetNum < 0) {
              validationError = 'Ngân sách không hợp lệ.';
              return;
            }
            updateData.budget = budgetNum;
          }
          break;
        case 'requirements':
        case 'eventName':
        case 'location':
        case 'eventType':
        case 'status':
        case 'contactName':
        case 'contactPhone':
        case 'contactEmail':
          // Kiểm tra xem key có phải là một path hợp lệ trong schema không để tránh ghi đè không mong muốn
          if (BookingRequest.schema.path(K)) {
            (updateData[K] as any) = value as string;
          }
          break;
        // Các trường như userId, createdAt, updatedAt không nên được cập nhật qua form này
      }
    });

    // Kiểm tra nếu có lỗi validation xảy ra trong forEach
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Không có dữ liệu nào được cung cấp để cập nhật.' }, { status: 400 });
    }

    const updatedBookingRequest = await BookingRequest.findByIdAndUpdate(
      id,
      { $set: updateData }, // Sử dụng $set để chỉ cập nhật các trường được cung cấp
      { new: true, runValidators: true } // new: true trả về document đã update, runValidators: true để chạy validate của schema
    );

    if (!updatedBookingRequest) {
      return NextResponse.json({ error: 'Yêu cầu đặt lịch không tìm thấy.' }, { status: 404 });
    }

    return NextResponse.json(updatedBookingRequest);

  } catch (error: any) {
    console.error('Error updating booking request:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message).join('; ');
      return NextResponse.json({ error: `Dữ liệu không hợp lệ: ${messages}`, details: error.errors }, { status: 400 });
    }
    if (error.name === 'CastError' && error.path === '_id') { // Lỗi khi cast ID không hợp lệ
      return NextResponse.json({ error: 'ID yêu cầu đặt lịch không hợp lệ (cast error).' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Lỗi máy chủ khi cập nhật yêu cầu đặt lịch.', details: error.message }, { status: 500 });
  }
}

// DELETE: Xóa một yêu cầu đặt lịch
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { id } = params;

  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: 'ID yêu cầu đặt lịch không hợp lệ.' }, { status: 400 });
  }

  try {
    // Ví dụ: Kiểm tra session admin nếu chỉ admin được phép xóa
    // const session = await getServerSession(adminAuthOptions);
    // if (!session || !session.user.isAdmin) {
    //     return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    // }

    await connectToDatabase();
    const deletedBookingRequest = await BookingRequest.findByIdAndDelete(id);

    if (!deletedBookingRequest) {
      return NextResponse.json({ error: 'Yêu cầu đặt lịch không tìm thấy.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Yêu cầu đặt lịch đã được xóa thành công.' });

  } catch (error: any) {
    console.error('Error deleting booking request:', error);
    if (error.name === 'CastError' && error.path === '_id') { // Lỗi khi cast ID không hợp lệ
      return NextResponse.json({ error: 'ID yêu cầu đặt lịch không hợp lệ (cast error).' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Lỗi máy chủ khi xóa yêu cầu đặt lịch.', details: error.message }, { status: 500 });
  }
}