import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { promises as fs } from 'fs';
import path from 'path';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const id = params.id;

    // Lấy thông tin bài hát trước khi xóa
    const music = await db.collection('music').findOne({ _id: new ObjectId(id) });

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

      // Xóa record trong database
      const result = await db.collection('music').deleteOne({ _id: new ObjectId(id) });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Music not found' }, { status: 404 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error deleting music' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const formData = await request.formData();
    const id = params.id;

    const updateData: any = {
      title: formData.get('title'),
      description: formData.get('description'),
      artist: formData.get('artist'),
      isPublished: formData.has('isPublished'), // Sửa lại cách check checkbox
      updatedAt: new Date()
    };

    console.log('Update data:', updateData); // Thêm log để debug
    // Handle image upload
    const imageFile = formData.get('image') as File;
    if (imageFile?.size > 0) {
      const imageBytes = await imageFile.arrayBuffer();
      const imageBuffer = Buffer.from(imageBytes);
      const imagePath = `/uploads/music/images/${Date.now()}_${imageFile.name}`;
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
      const audioPath = `/uploads/music/audio/${Date.now()}_${audioFile.name}`;
      const fullAudioPath = path.join(process.cwd(), 'public', audioPath);
      await fs.mkdir(path.dirname(fullAudioPath), { recursive: true });
      await fs.writeFile(fullAudioPath, audioBuffer);
      updateData.audio = audioPath;
    }

    const result = await db.collection('music').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error updating music' }, { status: 500 });
  }
}