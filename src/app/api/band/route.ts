import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Band from '@/lib/models/Band';

// GET all band info
export async function GET() {
  try {
    await connectDB();
    const bands = await Band.find();
    return NextResponse.json(bands);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST new band info
export async function POST(req: Request) {
  try {
    await connectDB();
    const data = await req.json();
    const band = await Band.create(data);
    return NextResponse.json(band, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}