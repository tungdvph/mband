import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Member from '@/lib/models/Member';
import { promises as fs } from 'fs';
import path from 'path';

interface MemberData {
  name: string;
  role: string;
  description?: string;
  isActive: boolean;
  image?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const formData = await request.formData();
    
    const memberData: MemberData = {
      name: formData.get('name')?.toString() || '',
      role: formData.get('role')?.toString() || '',
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
    if (imageFile && imageFile.size > 0) {
      const imageBytes = await imageFile.arrayBuffer();
      const imageBuffer = Buffer.from(imageBytes);
      const imagePath = `/upload/member/${Date.now()}_${imageFile.name}`;
      const fullImagePath = path.join(process.cwd(), 'public', imagePath);
      await fs.mkdir(path.dirname(fullImagePath), { recursive: true });
      await fs.writeFile(fullImagePath, imageBuffer);
      memberData.image = imagePath;
    }

    const member = new Member(memberData);
    const savedMember = await member.save();
    return NextResponse.json({ member: savedMember });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error creating member' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const members = await Member.find().sort({ createdAt: -1 });
    return NextResponse.json(members);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching members' }, { status: 500 });
  }
}