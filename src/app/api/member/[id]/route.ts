import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Member from '@/lib/models/Member';
import { promises as fs } from 'fs';
import path from 'path';

interface MemberUpdateData {
  name?: string;
  role?: string;
  description?: string;
  isActive: boolean;
  image?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const member = await Member.findById(params.id);

    if (member) {
      // Xóa file ảnh nếu tồn tại và không phải ảnh mặc định
      if (member.image && !member.image.includes('default-member.png')) {
        const imagePath = path.join(process.cwd(), 'public', member.image);
        await fs.unlink(imagePath).catch(() => {});
      }

      await member.deleteOne();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error deleting member' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const formData = await request.formData();

    const updateData: MemberUpdateData = {
      name: formData.get('name')?.toString(),
      role: formData.get('role')?.toString(),
      description: formData.get('description')?.toString(),
      isActive: formData.get('isActive') === 'true',
      socialLinks: {
        facebook: formData.get('facebook')?.toString(),
        instagram: formData.get('instagram')?.toString(),
        twitter: formData.get('twitter')?.toString()
      }
    };

    // Handle image upload
    const imageFile = formData.get('image') as File;
    if (imageFile?.size > 0) {
      const imageBytes = await imageFile.arrayBuffer();
      const imageBuffer = Buffer.from(imageBytes);
      const imagePath = `/upload/member/${Date.now()}_${imageFile.name}`;
      const fullImagePath = path.join(process.cwd(), 'public', imagePath);
      await fs.mkdir(path.dirname(fullImagePath), { recursive: true });
      await fs.writeFile(fullImagePath, imageBuffer);
      updateData.image = imagePath;

      // Xóa ảnh cũ nếu có
      const oldMember = await Member.findById(params.id);
      if (oldMember?.image && !oldMember.image.includes('default-member.png')) {
        const oldImagePath = path.join(process.cwd(), 'public', oldMember.image);
        await fs.unlink(oldImagePath).catch(() => {});
      }
    }

    const updatedMember = await Member.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({ member: updatedMember });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error updating member' }, { status: 500 });
  }
}