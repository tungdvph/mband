import { NextResponse } from 'next/server';
import News from '@/lib/models/News';
import { connectToDatabase } from '@/lib/mongodb';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const formData = await request.formData();

    console.log('FormData received:', Object.fromEntries(formData.entries()));

    const newsData = {
      title: formData.get('title')?.toString() || '',
      author: formData.get('author')?.toString() || '',
      content: formData.get('content')?.toString() || '',
      isPublished: formData.get('isPublished') === 'true',
      image: formData.get('image') ? formData.get('image')?.toString() : '/default-news.png',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('NewsData before save:', newsData);

    if (!newsData.title || !newsData.content) {
      return NextResponse.json(
        { error: 'Tiêu đề và nội dung không được để trống' }, 
        { status: 400 }
      );
    }

    try {
      const news = new News(newsData);
      console.log('News model instance:', news);
      const savedNews = await news.save();
      console.log('Saved news:', savedNews);
      return NextResponse.json({ news: savedNews });
    } catch (mongooseError: any) {
      console.error('Mongoose save error:', mongooseError);
      return NextResponse.json({ 
        error: 'Lỗi khi lưu vào database',
        details: mongooseError?.message || 'Unknown mongoose error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Create news error:', error);
    return NextResponse.json({ 
      error: 'Lỗi khi tạo tin tức',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('admin') === 'true';

    const query = isAdmin ? {} : { isPublished: true };
    const news = await News.find(query)
      .sort({ createdAt: -1 })
      .exec();

    return NextResponse.json(news);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching news' }, { status: 500 });
  }
}