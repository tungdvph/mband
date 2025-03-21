import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

interface UpdateMemberData {
  name: FormDataEntryValue | null;
  role: FormDataEntryValue | null;
  description: FormDataEntryValue | null;
  isActive: boolean;
  updatedAt: Date;
  image?: string;
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase();
    const formData = await request.formData();
    
    const updateData: UpdateMemberData = {
      name: formData.get('name'),
      role: formData.get('role'),
      description: formData.get('description'),
      isActive: formData.get('isActive') === 'true',
      updatedAt: new Date()
    };

    const imageFile = formData.get('image') as File;
    
    if (imageFile && imageFile.size > 0) {
      const imageBytes = await imageFile.arrayBuffer();
      const imageBuffer = Buffer.from(imageBytes);
      const imagePath = `/uploads/images/${Date.now()}_${imageFile.name}`;
      const fullImagePath = path.join(process.cwd(), 'public', imagePath);
      await fs.mkdir(path.dirname(fullImagePath), { recursive: true });
      await fs.writeFile(fullImagePath, imageBuffer);
      updateData.image = imagePath;
    }

    const result = await db.collection('members').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error updating member' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase();
    const result = await db.collection('members').deleteOne({
      _id: new ObjectId(params.id)
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting member' }, { status: 500 });
  }
}