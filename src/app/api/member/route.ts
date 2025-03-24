import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Member from '@/lib/models/Member';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
    try {
        await connectToDatabase();
        const formData = await request.formData();
        
        // Xử lý file ảnh
        const file = formData.get('image') as File;
        let imagePath = '/default-avatar.png';
        
        if (file) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            
            const fileName = `${Date.now()}-${file.name}`;
            const uploadDir = path.join(process.cwd(), 'public', 'upload', 'member');
            const filePath = path.join(uploadDir, fileName);
            
            await writeFile(filePath, buffer);
            imagePath = `/upload/member/${fileName}`;
        }

        const memberData = {
            name: formData.get('name'),
            role: formData.get('role'),
            description: formData.get('description'),
            isActive: formData.get('isActive') === 'true',
            image: imagePath
        };

        const member = new Member(memberData);
        const savedMember = await member.save();

        return NextResponse.json(savedMember);
    } catch (error) {
        console.error('Create member error:', error);
        return NextResponse.json({ error: 'Lỗi khi tạo thành viên' }, { status: 500 });
    }
}

export async function GET() {
    try {
        await connectToDatabase();
        const members = await Member.find();
        
        const transformedMembers = members.map(member => ({
            ...member.toObject(),
            image: member.image || '/default-member.png'
        }));
        
        return NextResponse.json(transformedMembers);
    } catch (error) {
        return NextResponse.json({ error: 'Lỗi khi lấy danh sách thành viên' }, { status: 500 });
    }
}