import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

interface MusicData {
  title: FormDataEntryValue | null;
  description: FormDataEntryValue | null;
  artist: FormDataEntryValue | null;
  isPublished: boolean;
  image?: string;
  audio?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const formData = await request.formData();
    
    const musicData: MusicData = {
      title: formData.get('title'),
      description: formData.get('description'),
      artist: formData.get('artist'),
      isPublished: formData.get('isPublished') === 'true',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Handle image upload
    const imageFile = formData.get('image') as File;
    if (imageFile && imageFile.size > 0) {
      const imageBytes = await imageFile.arrayBuffer();
      const imageBuffer = Buffer.from(imageBytes);
      const imagePath = `/uploads/music/images/${Date.now()}_${imageFile.name}`;
      const fullImagePath = path.join(process.cwd(), 'public', imagePath);
      await fs.mkdir(path.dirname(fullImagePath), { recursive: true });
      await fs.writeFile(fullImagePath, imageBuffer);
      musicData.image = imagePath;
    }

    // Handle audio upload
    const audioFile = formData.get('audio') as File;
    if (audioFile && audioFile.size > 0) {
      const audioBytes = await audioFile.arrayBuffer();
      const audioBuffer = Buffer.from(audioBytes);
      const audioPath = `/uploads/music/audio/${Date.now()}_${audioFile.name}`;
      const fullAudioPath = path.join(process.cwd(), 'public', audioPath);
      await fs.mkdir(path.dirname(fullAudioPath), { recursive: true });
      await fs.writeFile(fullAudioPath, audioBuffer);
      musicData.audio = audioPath;
    }

    const result = await db.collection('music').insertOne(musicData);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error creating music' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const music = await db.collection('music').find().sort({ createdAt: -1 }).toArray();
    return NextResponse.json(music);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching music' }, { status: 500 });
  }
}