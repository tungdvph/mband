import { NextRequest, NextResponse } from 'next/server';
import Comment from '@/lib/models/Comment';
import User from '@/lib/models/User';
import Music from '@/lib/models/Music';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { publicAuthOptions } from "@/lib/publicAuth"; // Đường dẫn này tùy bạn cấu hình

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const musicId = params.id;
  if (!mongoose.Types.ObjectId.isValid(musicId)) {
    return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });
  }
  const comments = await Comment.find({ musicId }).sort({ createdAt: -1 });
  return NextResponse.json(comments);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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
  // Lấy thông tin user
  const user = await User.findById(session.user.id);
  if (!user) {
    return NextResponse.json({ error: 'Không tìm thấy user' }, { status: 404 });
  }
  // Kiểm tra bài nhạc có tồn tại không (tùy bạn muốn kiểm tra hay không)
  const music = await Music.findById(musicId);
  if (!music) {
    return NextResponse.json({ error: 'Không tìm thấy bài nhạc' }, { status: 404 });
  }
  const newComment = await Comment.create({
    musicId,
    userId: user._id,
    userFullName: user.fullName,
    content
  });
  return NextResponse.json(newComment, { status: 201 });
}