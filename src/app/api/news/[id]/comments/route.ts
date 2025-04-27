import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Comment from '@/lib/models/Comment';
import User from '@/lib/models/User';
import News from '@/lib/models/News';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { publicAuthOptions } from "@/lib/publicAuth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();
  const newsId = params.id;
  if (!mongoose.Types.ObjectId.isValid(newsId)) {
    return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });
  }
  const news = await News.findById(newsId).select('title');
  if (!news) {
    return NextResponse.json({ error: 'Không tìm thấy tin tức' }, { status: 404 });
  }
  const comments = await Comment.find({ newsId }).sort({ createdAt: -1 });
  const commentsWithNewsTitle = comments.map(comment => ({
    ...comment.toObject(),
    newsTitle: news.title
  }));
  return NextResponse.json(commentsWithNewsTitle);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();
  const session = await getServerSession(publicAuthOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Bạn chưa đăng nhập' }, { status: 401 });
  }
  const newsId = params.id;
  if (!mongoose.Types.ObjectId.isValid(newsId)) {
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
  const news = await News.findById(newsId);
  if (!news) {
    return NextResponse.json({ error: 'Không tìm thấy tin tức' }, { status: 404 });
  }
  const newComment = await Comment.create({
    newsId,
    userId: user._id,
    userFullName: user.fullName,
    content,
    createdAt: new Date()
  });
  return NextResponse.json(newComment, { status: 201 });
}