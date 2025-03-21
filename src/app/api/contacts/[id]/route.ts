import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase();
    const contactData = await request.json();
    const { _id, ...updateData } = contactData;

    const result = await db.collection('contacts').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Error updating contact' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase();
    const result = await db.collection('contacts').deleteOne({
      _id: new ObjectId(params.id)
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting contact' }, { status: 500 });
  }
}