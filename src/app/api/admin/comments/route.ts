// api/admin/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Comment, { IComment } from '@/lib/models/Comment';
// Import IMusic đã được export và Model Music
import Music, { IMusic } from '@/lib/models/Music'; // Import này bây giờ sẽ hoạt động
import mongoose from 'mongoose'; // Import mongoose nếu cần dùng ObjectId

// Interface cho kết quả sau khi populate (dùng object thuần túy do .lean())
interface PopulatedCommentLean {
    _id: mongoose.Types.ObjectId; // Hoặc string nếu bạn chuyển đổi ngay
    musicId: { // musicId giờ là object thuần túy
        _id: mongoose.Types.ObjectId; // Hoặc string
        title: string;
    } | null; // Populated field có thể là null nếu không tìm thấy Music
    userId: mongoose.Types.ObjectId; // Hoặc string
    userFullName: string;
    content: string;
    createdAt: Date; // Hoặc string nếu chuyển đổi
}


export async function GET(req: NextRequest) {
    await connectToDatabase();
    try {
        // Sử dụng populate và lean()
        const comments = await Comment.find({})
            .sort({ createdAt: -1 })
            // Chỉ định rõ kiểu cho populate nếu cần, nhưng lean() thường giải quyết vấn đề type
            .populate<{ musicId: Pick<IMusic, '_id' | 'title'> | null }>('musicId', 'title _id')
            .lean<PopulatedCommentLean[]>(); // Ép kiểu kết quả của lean()

        // Định dạng lại dữ liệu, bây giờ comments là array các object thuần túy
        const formattedComments = comments.map(comment => {
            // Truy cập trực tiếp vào các thuộc tính của object thuần túy
            // Kiểm tra null cho musicId do populate có thể thất bại
            const musicTitle = comment.musicId?.title;
            const musicIdString = comment.musicId?._id?.toString();

            return {
                _id: comment._id.toString(), // Chuyển ObjectId thành string
                musicId: musicIdString || 'ID không xác định', // Id bài nhạc (string)
                musicTitle: musicTitle || 'Không rõ', // Tên bài nhạc (string)
                userFullName: comment.userFullName,
                content: comment.content,
                createdAt: comment.createdAt.toISOString(), // Chuyển Date thành string ISO
            };
        });

        return NextResponse.json(formattedComments);
    } catch (error) {
        console.error("Error fetching comments for admin:", error);
        return NextResponse.json({ error: 'Lỗi khi tải bình luận' }, { status: 500 });
    }
}

// --- Hàm POST ---
// Interface cho body request POST
interface PostRequestBody {
    musicId: string;
    userFullName: string;
    content: string;
    userId?: string; // userId tùy chọn
}

export async function POST(req: NextRequest) {
    await connectToDatabase();
    let body: PostRequestBody;

    try {
        body = await req.json();
    } catch (error) {
        return NextResponse.json({ error: 'Request body không hợp lệ (không phải JSON)' }, { status: 400 });
    }


    // --- VALIDATION ---
    if (!body.musicId || !mongoose.Types.ObjectId.isValid(body.musicId)) {
        return NextResponse.json({ error: 'musicId không hợp lệ hoặc bị thiếu' }, { status: 400 });
    }
    if (!body.userFullName || typeof body.userFullName !== 'string' || body.userFullName.trim().length === 0) {
        return NextResponse.json({ error: 'userFullName không hợp lệ hoặc bị thiếu' }, { status: 400 });
    }
    if (!body.content || typeof body.content !== 'string' || body.content.trim().length === 0) {
        return NextResponse.json({ error: 'Nội dung bình luận (content) không được để trống' }, { status: 400 });
    }
    // TODO: Thêm validation cho userId nếu bắt buộc

    try {
        const newCommentData: Partial<IComment> = { // Sử dụng Partial vì _id, createdAt sẽ tự tạo
            musicId: new mongoose.Types.ObjectId(body.musicId),
            userFullName: body.userFullName.trim(),
            content: body.content.trim(),
        };
        // Thêm userId nếu có và hợp lệ
        if (body.userId && mongoose.Types.ObjectId.isValid(body.userId)) {
            newCommentData.userId = new mongoose.Types.ObjectId(body.userId);
        } else {
            // Xử lý nếu userId bắt buộc nhưng không hợp lệ/thiếu?
            // Ví dụ: return NextResponse.json({ error: 'userId không hợp lệ hoặc bị thiếu' }, { status: 400 });
            // Hoặc dựa vào schema (nếu userId là required: true) thì lỗi sẽ tự ném ra ở dưới
        }


        const newComment = await Comment.create(newCommentData);

        // Populate lại ngay sau khi tạo nếu muốn trả về đầy đủ thông tin
        // Sử dụng lean() ở đây cũng rất hữu ích
        const populatedComment = await Comment.findById(newComment._id)
            .populate<{ musicId: Pick<IMusic, '_id' | 'title'> | null }>('musicId', 'title _id')
            .lean<PopulatedCommentLean>(); // Ép kiểu kết quả lean

        if (!populatedComment) {
            return NextResponse.json({ error: 'Không thể lấy thông tin bình luận vừa tạo' }, { status: 500 });
        }

        // Định dạng comment trả về (object thuần túy từ lean())
        const formattedComment = {
            _id: populatedComment._id.toString(),
            musicId: populatedComment.musicId?._id?.toString() || 'ID không xác định',
            musicTitle: populatedComment.musicId?.title || 'Không rõ',
            userFullName: populatedComment.userFullName,
            content: populatedComment.content,
            createdAt: populatedComment.createdAt.toISOString(),
        };

        return NextResponse.json(formattedComment, { status: 201 }); // Trả về 201 Created

    } catch (error: any) {
        console.error("Error creating comment:", error);
        // Bắt lỗi validation từ Mongoose
        if (error.name === 'ValidationError') {
            // Lấy thông điệp lỗi đầu tiên
            const messages = Object.values(error.errors).map((err: any) => err.message);
            return NextResponse.json({ error: `Validation Lỗi: ${messages.join(', ')}` }, { status: 400 });
        }
        // Lỗi chung khác
        return NextResponse.json({ error: 'Lỗi khi tạo bình luận' }, { status: 500 });
    }
}