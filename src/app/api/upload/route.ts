import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const type = formData.get('type') as string || 'user'; // Mặc định là user

        if (!file) {
            return NextResponse.json(
                { error: 'Không tìm thấy file' },
                { status: 400 }
            );
        }

        // Tạo buffer từ file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Tạo tên file unique với timestamp
        const timestamp = Date.now();
        const filename = `${timestamp}_${file.name}`;

        // Tạo đường dẫn theo cấu trúc mới: /upload/[type]/
        const uploadDir = path.join(process.cwd(), 'public', 'upload', type);
        const filepath = path.join(uploadDir, filename);

        // Tạo thư mục nếu chưa tồn tại
        await mkdir(uploadDir, { recursive: true });

        // Lưu file
        await writeFile(filepath, buffer);
        console.log('File saved to:', filepath);

        // Trả về URL của file theo cấu trúc mới
        const fileUrl = `/upload/${type}/${filename}`;
        return NextResponse.json({ url: fileUrl });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Lỗi khi upload file' },
            { status: 500 }
        );
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
};