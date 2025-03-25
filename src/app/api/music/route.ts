import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { promises as fs } from 'fs';
import path from 'path';
import Music from '@/lib/models/Music';

export const runtime = 'nodejs';

interface MusicData {
  title: string;
  description?: string;
  artist: string;
  isPublished: boolean;
  image?: string;
  audio?: string;
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const formData = await request.formData();
    
    const musicData: MusicData = {
      title: formData.get('title')?.toString() || '',
      description: formData.get('description')?.toString(),
      artist: formData.get('artist')?.toString() || '',
      isPublished: formData.get('isPublished') === 'true' || formData.get('isPublished') === 'on'
    };

    // Handle image upload
    const imageFile = formData.get('image') as File;
    if (imageFile && imageFile.size > 0) {
      const imageBytes = await imageFile.arrayBuffer();
      const imageBuffer = Buffer.from(imageBytes);
      const imagePath = `/upload/music/image/${Date.now()}_${imageFile.name}`;
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
      const audioPath = `/upload/music/audio/${Date.now()}_${audioFile.name}`;
      const fullAudioPath = path.join(process.cwd(), 'public', audioPath);
      await fs.mkdir(path.dirname(fullAudioPath), { recursive: true });
      await fs.writeFile(fullAudioPath, audioBuffer);
      musicData.audio = audioPath;
    }

    const music = new Music(musicData);
    const savedMusic = await music.save();
    return NextResponse.json({ music: savedMusic });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error creating music' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const music = await Music.find().sort({ createdAt: -1 });
    return NextResponse.json(music);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching music' }, { status: 500 });
  }
}