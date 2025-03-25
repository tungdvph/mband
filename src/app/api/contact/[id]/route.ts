import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb'; // Sửa import
import Contact from '@/lib/models/Contact';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase(); // Sửa tên hàm
    const contactData = await request.json();
    const { _id, ...updateData } = contactData;

    const updatedContact = await Contact.findByIdAndUpdate(
      params.id,
      { $set: updateData }, // Cho phép cập nhật nhiều trường hơn
      { new: true }
    );

    if (!updatedContact) {
      return NextResponse.json({ error: 'Không tìm thấy liên hệ' }, { status: 404 });
    }

    return NextResponse.json({ contact: updatedContact });
  } catch (error) {
    console.error('Error:', error); // Thêm log lỗi
    return NextResponse.json({ error: 'Lỗi cập nhật liên hệ' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase(); // Sửa tên hàm
    const contact = await Contact.findById(params.id);

    if (!contact) {
      return NextResponse.json({ error: 'Không tìm thấy liên hệ' }, { status: 404 });
    }

    await contact.deleteOne(); // Sử dụng method của mongoose
    return NextResponse.json({ success: true, message: 'Xóa liên hệ thành công' });
  } catch (error) {
    console.error('Error:', error); // Thêm log lỗi
    return NextResponse.json({ error: 'Lỗi khi xóa liên hệ' }, { status: 500 });
  }
}