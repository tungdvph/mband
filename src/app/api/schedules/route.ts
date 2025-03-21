import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const schedules = await db.collection('schedules').find().sort({ date: -1 }).toArray();
    return NextResponse.json(schedules);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching schedules' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const formData = await request.formData();
    
    const scheduleData = {
      title: formData.get('title'),
      description: formData.get('description'),
      date: new Date(formData.get('date') as string),
      location: formData.get('location'),
      type: formData.get('type'),
      participants: JSON.parse(formData.get('participants') as string),
      status: formData.get('status'),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('schedules').insertOne(scheduleData);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error creating schedule' }, { status: 500 });
  }
}