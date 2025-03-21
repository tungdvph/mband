import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

interface UpdateMusicData {
  title: FormDataEntryValue | null;
  description: FormDataEntryValue | null;
  artist: FormDataEntryValue | null;
  isPublished: boolean;
  updatedAt: Date;
  image?: string;
  audioFile?: string;
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase();
    const formData = await request.formData();
    
    const updateData: UpdateMusicData = {
      title: formData.get('title'),
      description: formData.get('description'),
      artist: formData.get('artist'),
      isPublished: formData.get('isPublished') === 'true',
      updatedAt: new Date()
    };

    const imageFile = formData.get('image') as File;
    const audioFile = formData.get('audioFile') as File;
    
    if (imageFile && imageFile.size > 0) {
      const imageBytes = await imageFile.arrayBuffer();
      const imageBuffer = Buffer.from(imageBytes);
      const imagePath = `/uploads/images/${Date.now()}_${imageFile.name}`;
      const fullImagePath = path.join(process.cwd(), 'public', imagePath);
      await fs.mkdir(path.dirname(fullImagePath), { recursive: true });
      await fs.writeFile(fullImagePath, imageBuffer);
      updateData.image = imagePath;
    }

    if (audioFile && audioFile.size > 0) {
      const audioBytes = await audioFile.arrayBuffer();
      const audioBuffer = Buffer.from(audioBytes);
      const audioPath = `/uploads/audio/${Date.now()}_${audioFile.name}`;
      const fullAudioPath = path.join(process.cwd(), 'public', audioPath);
      await fs.mkdir(path.dirname(fullAudioPath), { recursive: true });
      await fs.writeFile(fullAudioPath, audioBuffer);
      updateData.audioFile = audioPath;
    }

    const result = await db.collection('musics').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error updating music' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase();
    const result = await db.collection('musics').deleteOne({
      _id: new ObjectId(params.id)
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting music' }, { status: 500 });
  }
}