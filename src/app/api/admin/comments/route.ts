// /api/admin/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Comment, { IComment } from '@/lib/models/Comment';
import Music, { IMusic } from '@/lib/models/Music';
import News, { INews } from '@/lib/models/News'; // <-- Import News model và interface (đảm bảo INews được export từ News.ts)
import mongoose from 'mongoose';

// Interface cho comment sau khi populate - cần bao gồm cả newsId
interface PopulatedCommentLean {
    _id: mongoose.Types.ObjectId;
    musicId?: { _id: mongoose.Types.ObjectId; title: string; } | null; // Có thể là null hoặc không tồn tại
    newsId?: { _id: mongoose.Types.ObjectId; title: string; } | null;  // <-- Thêm newsId (có thể là null hoặc không tồn tại)
    userId?: mongoose.Types.ObjectId; // Giả sử schema có userId, nếu không thì bỏ qua
    userFullName: string;
    content: string;
    createdAt: Date;
    // Thêm các trường khác từ Comment schema nếu cần (vd: parentId, updatedAt)
}

// Interface cho dữ liệu trả về frontend
interface FormattedAdminComment {
    _id: string;
    musicId?: string; // ID dưới dạng string (nếu có)
    newsId?: string;  // ID dưới dạng string (nếu có)
    referenceTitle: string; // Tên bài nhạc HOẶC bài viết
    referenceType: 'Music' | 'News' | 'Unknown'; // Loại nội dung
    userFullName: string;
    content: string;
    createdAt: string; // ISO string
}


export async function GET(req: NextRequest) {
    await connectToDatabase();
    try {
        // Populate cả musicId và newsId. Chọn các trường cần thiết ('title', '_id')
        const comments = await Comment.find({})
            .sort({ createdAt: -1 })
            .populate<{ musicId: Pick<IMusic, '_id' | 'title'> | null }>('musicId', 'title _id')
            .populate<{ newsId: Pick<INews, '_id' | 'title'> | null }>('newsId', 'title _id') // <-- Populate newsId
            .lean<PopulatedCommentLean[]>(); // Sử dụng lean để lấy plain object

        // Định dạng lại dữ liệu cho frontend
        const formattedComments: FormattedAdminComment[] = comments.map(comment => {
            let referenceTitle = 'Không rõ';
            let referenceType: 'Music' | 'News' | 'Unknown' = 'Unknown';
            let musicIdString: string | undefined = undefined;
            let newsIdString: string | undefined = undefined;

            // Kiểm tra xem musicId có được populate thành công không
            if (comment.musicId?._id && comment.musicId.title) {
                referenceTitle = comment.musicId.title;
                referenceType = 'Music';
                musicIdString = comment.musicId._id.toString();
            }
            // Nếu không phải music, kiểm tra xem newsId có được populate không
            else if (comment.newsId?._id && comment.newsId.title) {
                referenceTitle = comment.newsId.title;
                referenceType = 'News';
                newsIdString = comment.newsId._id.toString();
            }
            // Trường hợp comment không có musicId lẫn newsId hợp lệ (dữ liệu cũ hoặc lỗi)
            // thì giữ nguyên giá trị mặc định 'Không rõ', 'Unknown'

            return {
                _id: comment._id.toString(),
                musicId: musicIdString,
                newsId: newsIdString,
                referenceTitle: referenceTitle,
                referenceType: referenceType,
                userFullName: comment.userFullName,
                content: comment.content,
                createdAt: comment.createdAt.toISOString(),
            };
        });

        return NextResponse.json(formattedComments);
    } catch (error) {
        console.error("Error fetching comments for admin:", error);
        const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định khi tải bình luận';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// --- Hàm POST ---
// Hàm POST này hiện đang được thiết kế để admin thêm comment cho MUSIC.
// Nếu bạn muốn admin có thể thêm comment cho cả NEWS từ đây, cần:
// 1. Sửa PostRequestBody để nhận newsId (tùy chọn)
// 2. Thêm logic để kiểm tra và chỉ định musicId HOẶC newsId khi tạo Comment.create
// 3. Cập nhật form ở frontend để cho phép chọn loại và ID tương ứng.
// Hiện tại giữ nguyên logic chỉ hỗ trợ Music.

interface PostRequestBody {
    musicId: string; // Hiện chỉ hỗ trợ musicId
    userFullName: string;
    content: string;
    // userId?: string; // Cân nhắc xem có cần admin gán userId không, thường là không cần
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
    // Giữ nguyên validation cho musicId vì form hiện tại chỉ hỗ trợ nó
    if (!body.musicId || !mongoose.Types.ObjectId.isValid(body.musicId)) {
        return NextResponse.json({ error: 'musicId không hợp lệ hoặc bị thiếu' }, { status: 400 });
    }
    if (!body.userFullName || typeof body.userFullName !== 'string' || body.userFullName.trim().length === 0) {
        return NextResponse.json({ error: 'userFullName không hợp lệ hoặc bị thiếu' }, { status: 400 });
    }
    if (!body.content || typeof body.content !== 'string' || body.content.trim().length === 0) {
        return NextResponse.json({ error: 'Nội dung bình luận (content) không được để trống' }, { status: 400 });
    }

    try {
        // Kiểm tra xem Music có tồn tại không trước khi tạo comment
        const musicExists = await Music.findById(body.musicId);
        if (!musicExists) {
            return NextResponse.json({ error: `Không tìm thấy bài nhạc với ID: ${body.musicId}` }, { status: 404 });
        }

        // Tạo comment mới chỉ với musicId
        const newCommentData: Partial<IComment> = {
            musicId: new mongoose.Types.ObjectId(body.musicId),
            userFullName: body.userFullName.trim(),
            content: body.content.trim(),
            // Lưu ý: Thiếu userId. Admin comment có cần liên kết với User nào không?
            // Nếu không, cần xem lại schema Comment xem userId có thực sự required không.
            // Nếu required, bạn cần lấy userId của admin đang đăng nhập hoặc cho phép chọn User.
            // Tạm thời bỏ qua userId nếu schema cho phép null hoặc không required.
            // userId: adminUserId, // Ví dụ: lấy từ session admin
        };

        const newComment = await Comment.create(newCommentData);

        // Populate lại thông tin để trả về (chủ yếu là lấy musicTitle)
        const populatedComment = await Comment.findById(newComment._id)
            .populate<{ musicId: Pick<IMusic, '_id' | 'title'> | null }>('musicId', 'title _id')
            // Không cần populate newsId ở đây vì ta chỉ tạo cho Music
            .lean<PopulatedCommentLean>(); // Dùng interface cũ vì chỉ populate music

        if (!populatedComment) {
            return NextResponse.json({ error: 'Không thể lấy thông tin bình luận vừa tạo' }, { status: 500 });
        }

        // Định dạng comment trả về theo format mới
        const formattedComment: FormattedAdminComment = {
            _id: populatedComment._id.toString(),
            musicId: populatedComment.musicId?._id?.toString(),
            newsId: undefined, // Không có newsId khi tạo bằng form này
            referenceTitle: populatedComment.musicId?.title || 'Không rõ',
            referenceType: 'Music',
            userFullName: populatedComment.userFullName,
            content: populatedComment.content,
            createdAt: populatedComment.createdAt.toISOString(),
        };

        return NextResponse.json(formattedComment, { status: 201 });

    } catch (error: any) {
        console.error("Error creating comment:", error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((err: any) => err.message);
            return NextResponse.json({ error: `Validation Lỗi: ${messages.join(', ')}` }, { status: 400 });
        }
        return NextResponse.json({ error: 'Lỗi khi tạo bình luận' }, { status: 500 });
    }
}