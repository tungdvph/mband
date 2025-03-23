import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

interface NewsData {
  title: FormDataEntryValue | null;
  content: FormDataEntryValue | null;
  author: FormDataEntryValue | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  image?: string;
}

export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const formData = await request.formData();

    const newsData = {
      title: formData.get('title')?.toString() || '',
      author: formData.get('author')?.toString() || '',
      content: formData.get('content')?.toString() || '',
      isPublished: formData.get('isPublished') === 'true',
      image: formData.get('image')?.toString() || '/default-news.png', // Thêm default image
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('news').insertOne(newsData);
    const savedNews = await db.collection('news').findOne({ _id: result.insertedId });

    return NextResponse.json({ news: savedNews });
  } catch (error) {
    console.error('Create news error:', error);
    return NextResponse.json({ error: 'Lỗi khi tạo tin tức' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('admin') === 'true';

    // Query khác nhau cho admin và public
    const query = isAdmin ? {} : { isPublished: true };
    
    const news = await db.collection('news')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(news);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching news' }, { status: 500 });
  }
}