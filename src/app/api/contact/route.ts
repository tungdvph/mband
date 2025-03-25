import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb'; // Sửa import
import Contact from '@/lib/models/Contact';

export async function GET() {
  try {
    await connectToDatabase(); // Sửa tên hàm
    const contacts = await Contact.find().sort({ createdAt: -1 });
    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Error:', error); // Thêm log lỗi
    return NextResponse.json({ error: 'Lỗi khi tải danh sách liên hệ' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase(); // Sửa tên hàm
    const contactData = await request.json();
    const contact = new Contact(contactData); // Sửa cách tạo document
    const savedContact = await contact.save();
    return NextResponse.json({ contact: savedContact }, { status: 201 }); // Thêm wrapper object
  } catch (error) {
    console.error('Error:', error); // Thêm log lỗi
    return NextResponse.json({ error: 'Lỗi khi tạo liên hệ mới' }, { status: 500 });
  }
}