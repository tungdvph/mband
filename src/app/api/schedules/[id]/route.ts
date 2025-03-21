import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const runtime = 'nodejs';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase();
    const formData = await request.formData();
    
    const updateData = {
      title: formData.get('title'),
      description: formData.get('description'),
      date: new Date(formData.get('date') as string),
      location: formData.get('location'),
      type: formData.get('type'),
      participants: JSON.parse(formData.get('participants') as string),
      status: formData.get('status'),
      updatedAt: new Date()
    };

    const result = await db.collection('schedules').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error updating schedule' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase();
    const result = await db.collection('schedules').deleteOne({
      _id: new ObjectId(params.id)
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting schedule' }, { status: 500 });
  }
}