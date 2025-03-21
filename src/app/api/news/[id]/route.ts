import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase();
    const newsData = await request.json();
    const { _id, ...updateData } = newsData;

    updateData.updatedAt = new Date();

    const result = await db.collection('news').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Error updating news' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase();
    const result = await db.collection('news').deleteOne({
      _id: new ObjectId(params.id)
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting news' }, { status: 500 });
  }
}