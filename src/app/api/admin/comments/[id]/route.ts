import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Comment from '@/lib/models/Comment';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();
  const body = await req.json();
  const updated = await Comment.findByIdAndUpdate(
    params.id,
    { content: body.content },
    { new: true }
  );
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();
  await Comment.findByIdAndDelete(params.id);
  return NextResponse.json({ success: true });
}