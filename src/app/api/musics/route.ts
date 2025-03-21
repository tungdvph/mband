import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const musics = await db.collection('musics').find().sort({ createdAt: -1 }).toArray();
    return NextResponse.json(musics);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching musics' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const formData = await request.formData();
    
    const imageFile = formData.get('image') as File;
    const audioFile = formData.get('audioFile') as File;
    
    // Handle image upload
    const imageBytes = await imageFile.arrayBuffer();
    const imageBuffer = Buffer.from(imageBytes);
    const imagePath = `/uploads/images/${Date.now()}_${imageFile.name}`;
    const fullImagePath = path.join(process.cwd(), 'public', imagePath);
    await fs.mkdir(path.dirname(fullImagePath), { recursive: true });
    await fs.writeFile(fullImagePath, imageBuffer);

    // Handle audio upload
    const audioBytes = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(audioBytes);
    const audioPath = `/uploads/audio/${Date.now()}_${audioFile.name}`;
    const fullAudioPath = path.join(process.cwd(), 'public', audioPath);
    await fs.mkdir(path.dirname(fullAudioPath), { recursive: true });
    await fs.writeFile(fullAudioPath, audioBuffer);

    const musicData = {
      title: formData.get('title'),
      description: formData.get('description'),
      artist: formData.get('artist'),
      image: imagePath,
      audioFile: audioPath,
      isPublished: formData.get('isPublished') === 'true',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('musics').insertOne(musicData);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error creating music' }, { status: 500 });
  }
}