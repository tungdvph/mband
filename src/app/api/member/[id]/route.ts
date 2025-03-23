import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { writeFile } from 'fs/promises';
import path from 'path';

interface UpdateData {
    name: string | null;
    role: string | null;
    description: string | null;
    isActive: boolean;
    updatedAt: Date;
    image?: string;
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { db } = await connectToDatabase();
        const formData = await request.formData();
        
        // Xử lý file ảnh mới nếu có
        const file = formData.get('image') as File;
        let imagePath = undefined;
        
        if (file && file.size > 0) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            
            const fileName = `${Date.now()}-${file.name}`;
            const uploadDir = path.join(process.cwd(), 'public', 'upload', 'member');
            const filePath = path.join(uploadDir, fileName);
            
            await writeFile(filePath, buffer);
            imagePath = `/upload/member/${fileName}`;
        }

        const updateData: UpdateData = {
            name: formData.get('name')?.toString() || null,
            role: formData.get('role')?.toString() || null,
            description: formData.get('description')?.toString() || null,
            isActive: formData.get('isActive') === 'true',
            updatedAt: new Date()
        };

        if (imagePath) {
            updateData.image = imagePath;
        }

        const result = await db.collection('member').findOneAndUpdate(
            { _id: new ObjectId(params.id) },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        if (!result) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('Update member error:', error);
        return NextResponse.json({ error: 'Error updating member' }, { status: 500 });
    }
}