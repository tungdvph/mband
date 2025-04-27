import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Comment from '@/lib/models/Comment';
import User from '@/lib/models/User';
import Music from '@/lib/models/Music';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { publicAuthOptions } from "@/lib/publicAuth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();
  const musicId = params.id;
  if (!mongoose.Types.ObjectId.isValid(musicId)) {
    return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });
  }
  const music = await Music.findById(musicId).select('title');
  if (!music) {
    return NextResponse.json({ error: 'Không tìm thấy bài nhạc' }, { status: 404 });
  }
  const comments = await Comment.find({ musicId }).sort({ createdAt: -1 });
  const commentsWithMusicTitle = comments.map(comment => ({
    ...comment.toObject(),
    musicTitle: music.title
  }));
  return NextResponse.json(commentsWithMusicTitle);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();
  const session = await getServerSession(publicAuthOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Bạn chưa đăng nhập' }, { status: 401 });
  }
  const musicId = params.id;
  if (!mongoose.Types.ObjectId.isValid(musicId)) {
    return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });
  }
  const { content } = await req.json();
  if (!content || !content.trim()) {
    return NextResponse.json({ error: 'Nội dung bình luận không được để trống' }, { status: 400 });
  }
  const user = await User.findById(session.user.id);
  if (!user) {
    return NextResponse.json({ error: 'Không tìm thấy user' }, { status: 404 });
  }
  const music = await Music.findById(musicId);
  if (!music) {
    return NextResponse.json({ error: 'Không tìm thấy bài nhạc' }, { status: 404 });
  }
  const newComment = await Comment.create({
    musicId,
    userId: user._id,
    userFullName: user.fullName,
    content,
    createdAt: new Date()
  });
  return NextResponse.json(newComment, { status: 201 });
}