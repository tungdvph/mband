import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Contact from '@/lib/models/Contact';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const contactData = await request.json();
    const { _id, ...updateData } = contactData;

    const result = await Contact.findByIdAndUpdate(
      params.id,
      { $set: { status: updateData.status } },
      { new: true }
    );

    if (!result) {
      return NextResponse.json({ error: 'Không tìm thấy liên hệ' }, { status: 404 });
    }

    return NextResponse.json({ contact: result });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi cập nhật liên hệ' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const result = await Contact.findByIdAndDelete(params.id);

    if (!result) {
      return NextResponse.json({ error: 'Không tìm thấy liên hệ' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Xóa liên hệ thành công' });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi khi xóa liên hệ' }, { status: 500 });
  }
}