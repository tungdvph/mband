import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { promises as fs } from 'fs';
import path from 'path';
import Music from '@/lib/models/Music';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const music = await Music.findById(params.id);
    
    if (!music) {
      return NextResponse.json({ error: 'Music not found' }, { status: 404 });
    }
    
    return NextResponse.json(music);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error fetching music' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const music = await Music.findById(params.id);

    if (music) {
      // Xóa file ảnh nếu tồn tại
      if (music.image) {
        const imagePath = path.join(process.cwd(), 'public', music.image);
        await fs.unlink(imagePath).catch(() => {});
      }

      // Xóa file audio nếu tồn tại
      if (music.audio) {
        const audioPath = path.join(process.cwd(), 'public', music.audio);
        await fs.unlink(audioPath).catch(() => {});
      }

      await music.deleteOne();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Music not found' }, { status: 404 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error deleting music' }, { status: 500 });
  }
}

interface MusicUpdateData {
  title?: string;
  description?: string;
  artist?: string;
  isPublished: boolean;
  updatedAt: Date;
  image?: string;
  audio?: string;
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const formData = await request.formData();

    const updateData: MusicUpdateData = {
      title: formData.get('title')?.toString(),
      description: formData.get('description')?.toString(),
      artist: formData.get('artist')?.toString(),
      isPublished: formData.get('isPublished') === 'true' || formData.get('isPublished') === 'on',
      updatedAt: new Date()
    };

    // Handle image upload
    const imageFile = formData.get('image') as File;
    if (imageFile?.size > 0) {
      const imageBytes = await imageFile.arrayBuffer();
      const imageBuffer = Buffer.from(imageBytes);
      const imagePath = `/upload/music/image/${Date.now()}_${imageFile.name}`;
      const fullImagePath = path.join(process.cwd(), 'public', imagePath);
      await fs.mkdir(path.dirname(fullImagePath), { recursive: true });
      await fs.writeFile(fullImagePath, imageBuffer);
      updateData.image = imagePath;
    }

    // Handle audio upload
    const audioFile = formData.get('audio') as File;
    if (audioFile?.size > 0) {
      const audioBytes = await audioFile.arrayBuffer();
      const audioBuffer = Buffer.from(audioBytes);
      const audioPath = `/upload/music/audio/${Date.now()}_${audioFile.name}`;
      const fullAudioPath = path.join(process.cwd(), 'public', audioPath);
      await fs.mkdir(path.dirname(fullAudioPath), { recursive: true });
      await fs.writeFile(fullAudioPath, audioBuffer);
      updateData.audio = audioPath;
    }

    const updatedMusic = await Music.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedMusic) {
      return NextResponse.json({ error: 'Music not found' }, { status: 404 });
    }

    return NextResponse.json({ music: updatedMusic });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error updating music' }, { status: 500 });
  }
}