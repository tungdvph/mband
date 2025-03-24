import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Member from '@/lib/models/Member';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';

interface UpdateMemberData {
    name?: string;
    role?: string;
    description?: string;
    isActive: boolean;
    image?: string;
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        await connectToDatabase();
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

        const updateData: UpdateMemberData = {
            name: formData.get('name')?.toString(),
            role: formData.get('role')?.toString(),
            description: formData.get('description')?.toString(),
            isActive: formData.get('isActive') === 'true'
        };

        if (imagePath) {
            updateData.image = imagePath;
        }

        const result = await Member.findByIdAndUpdate(
            params.id,
            updateData,
            { new: true }
        );

        if (!result) {
            return NextResponse.json({ error: 'Không tìm thấy thành viên' }, { status: 404 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Update member error:', error);
        return NextResponse.json({ error: 'Lỗi khi cập nhật thành viên' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        await connectToDatabase();
        const member = await Member.findById(params.id);

        if (!member) {
            return NextResponse.json({ error: 'Không tìm thấy thành viên' }, { status: 404 });
        }

        // Xóa file ảnh nếu có và không phải ảnh mặc định
        if (member.image && !member.image.includes('default-member.png')) {
            try {
                const imagePath = path.join(process.cwd(), 'public', 'upload', 'member', path.basename(member.image));
                await unlink(imagePath);
                console.log('Đã xóa file ảnh:', imagePath);
            } catch (error) {
                console.log('Lỗi khi xóa file ảnh:', error);
            }
        }

        await member.deleteOne();
        return NextResponse.json({ success: true, message: 'Đã xóa thành viên thành công' });
    } catch (error) {
        console.error('Delete member error:', error);
        return NextResponse.json({ error: 'Lỗi khi xóa thành viên' }, { status: 500 });
    }
}