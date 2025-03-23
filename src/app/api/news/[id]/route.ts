import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { promises as fs } from 'fs';
import path from 'path';

interface NewsUpdateData {
  title: string;
  author: string;
  content: string;
  isPublished: boolean;
  updatedAt: Date;
  image?: string;  // Optional field
}

export const runtime = 'nodejs';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase();
    const formData = await request.formData();

    // Add null checks and default values
    const updateData: NewsUpdateData = {
      title: formData.get('title')?.toString() || '',
      author: formData.get('author')?.toString() || '',
      content: formData.get('content')?.toString() || '',
      isPublished: formData.get('isPublished') === 'true',
      updatedAt: new Date()
    };

    const image = formData.get('image')?.toString();
    if (image) {
      updateData.image = image;
    }

    const result = await db.collection('news').findOneAndUpdate(
      { _id: new ObjectId(params.id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ error: 'Không tìm thấy tin tức' }, { status: 404 });
    }

    return NextResponse.json({ news: result });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Lỗi cập nhật tin tức' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase();

    // Lấy thông tin news trước khi xóa
    const news = await db.collection('news').findOne({
      _id: new ObjectId(params.id)
    });

    if (!news) {
      return NextResponse.json({ error: 'Không tìm thấy tin tức' }, { status: 404 });
    }

    // Xóa file ảnh nếu có và không phải ảnh mặc định
    if (news.image && !news.image.includes('default-news.png')) {
      try {
        const imagePath = path.join(process.cwd(), 'public', news.image.replace(/^\//, ''));
        await fs.unlink(imagePath);
        console.log('Đã xóa file ảnh:', imagePath);
      } catch (error) {
        console.log('Lỗi khi xóa file ảnh:', error);
      }
    }

    // Xóa news trong database
    const result = await db.collection('news').deleteOne({
      _id: new ObjectId(params.id)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Không thể xóa tin tức' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Đã xóa tin tức thành công' });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Lỗi khi xóa tin tức' }, { status: 500 });
  }
}