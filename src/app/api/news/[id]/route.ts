import { NextResponse } from 'next/server';
import News from '@/lib/models/News';
import { connectToDatabase } from '@/lib/mongodb';
import { unlink } from 'fs/promises';  // Thêm import này
import path from 'path';

interface NewsUpdateData {
  title: string;
  author: string;
  content: string;
  isPublished: boolean;
  updatedAt: Date;
  image?: string;
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const news = await News.findById(params.id);

    if (!news) {
      return NextResponse.json({ error: 'Không tìm thấy tin tức' }, { status: 404 });
    }

    return NextResponse.json(news);
  } catch (error) {
    console.error('Get news error:', error);
    return NextResponse.json({ error: 'Lỗi khi lấy chi tiết tin tức' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const formData = await request.formData();

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

    const updatedNews = await News.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    );

    if (!updatedNews) {
      return NextResponse.json({ error: 'Không tìm thấy tin tức' }, { status: 404 });
    }

    return NextResponse.json({ news: updatedNews });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Lỗi cập nhật tin tức' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const news = await News.findById(params.id);

    if (!news) {
      return NextResponse.json({ error: 'Không tìm thấy tin tức' }, { status: 404 });
    }

    if (news.image && !news.image.includes('default-news.png')) {
      try {
        const imagePath = path.join(process.cwd(), 'public', 'upload', 'news', path.basename(news.image));
        await unlink(imagePath);
        console.log('Đã xóa file ảnh:', imagePath);
      } catch (error) {
        console.log('Lỗi khi xóa file ảnh:', error);
      }
    }

    await news.deleteOne();
    return NextResponse.json({ success: true, message: 'Đã xóa tin tức thành công' });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Lỗi khi xóa tin tức' }, { status: 500 });
  }
}