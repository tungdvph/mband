import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const contacts = await db.collection('contacts').find().toArray();
    return NextResponse.json(contacts);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching contacts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const contactData = await request.json();
    
    // Add creation timestamp
    contactData.createdAt = new Date();
    
    const result = await db.collection('contacts').insertOne(contactData);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Error creating contact' }, { status: 500 });
  }
}