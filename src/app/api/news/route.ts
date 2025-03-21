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
    
    const newsData: NewsData = {
      title: formData.get('title'),
      content: formData.get('content'),
      author: formData.get('author'),
      isPublished: formData.get('isPublished') === 'true',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const imageFile = formData.get('image') as File;
    
    if (imageFile && imageFile.size > 0) {
      const imageBytes = await imageFile.arrayBuffer();
      const imageBuffer = Buffer.from(imageBytes);
      const imagePath = `/uploads/news/${Date.now()}_${imageFile.name}`;
      const fullImagePath = path.join(process.cwd(), 'public', imagePath);
      await fs.mkdir(path.dirname(fullImagePath), { recursive: true });
      await fs.writeFile(fullImagePath, imageBuffer);
      newsData.image = imagePath;
    }

    const result = await db.collection('news').insertOne(newsData);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error creating news' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const news = await db.collection('news').find().sort({ createdAt: -1 }).toArray();
    return NextResponse.json(news);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching news' }, { status: 500 });
  }
}