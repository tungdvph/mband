import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';  // Add this import
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
    try {
        const { db } = await connectToDatabase();
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
            image: imagePath,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('member').insertOne(memberData);
        const savedMember = await db.collection('member').findOne({ _id: result.insertedId });

        return NextResponse.json(savedMember);
    } catch (error) {
        console.error('Create member error:', error);
        return NextResponse.json({ error: 'Error creating member' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const { db } = await connectToDatabase();
        const members = await db.collection('member').find().toArray();
        
        // Transform each member to include default image if none exists
        const transformedMembers = members.map(member => ({
            ...member,
            image: member.image || '/default-member.png'
        }));
        
        return NextResponse.json(transformedMembers);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching members' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { db } = await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const result = await db.collection('member').deleteOne({ _id: new ObjectId(id) });
        
        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Error deleting member' }, { status: 500 });
    }
}