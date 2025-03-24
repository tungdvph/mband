import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Contact from '@/lib/models/Contact';

export async function GET() {
  try {
    await connectDB();
    const contacts = await Contact.find().sort({ createdAt: -1 });
    return NextResponse.json(contacts);
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi khi tải danh sách liên hệ' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const contactData = await request.json();
    const contact = await Contact.create(contactData);
    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi khi tạo liên hệ mới' }, { status: 500 });
  }
}