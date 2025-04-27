// Ví dụ: src/app/(public)/music/[id]/page.tsx
'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from "next-auth/react";
import Link from 'next/link';
import Layout from '@/components/layout/Layout'; // Điều chỉnh đường dẫn nếu cần
import MusicPlayer from '@/components/ui/MusicPlayer'; // Điều chỉnh đường dẫn nếu cần
import mongoose from 'mongoose'; // Import nếu cần kiểm tra ObjectId, không bắt buộc ở frontend

// --- Interfaces ---

interface MusicDetail {
    _id: string;
    title: string;
    artist: string;
    image?: string;
    audio: string;
    description?: string;
}

interface Comment {
    _id: string;
    content: string;
    userFullName: string;
    createdAt: string; // ISO date string
    musicId: string;
    parentId?: string | null;
    // userId?: { _id: string; fullName?: string; avatar?: string }; // Optional: nếu API populate user
}


// --- Component con: CommentItem ---

function CommentItem({
    comment,
    allComments,
    onReplySubmit,
    replyingTo,
    setReplyingTo,
    replyContent,
    setReplyContent,
    isPostingReply,
    currentUserId
}: {
    comment: Comment;
    allComments: Comment[];
    onReplySubmit: (parentId: string, content: string) => Promise<void>;
    replyingTo: string | null;
    setReplyingTo: (id: string | null) => void;
    replyContent: string;
    setReplyContent: (content: string) => void;
    isPostingReply: boolean;
    currentUserId?: string | null;
}) {
    const { data: session } = useSession();
    const isReplying = replyingTo === comment._id;

    const replies = allComments
        .filter(c => c.parentId === comment._id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const handleReplyClick = () => {
        if (!session) {
            alert("Bạn cần đăng nhập để phản hồi.");
            return;
        }
        setReplyingTo(isReplying ? null : comment._id); // Mở/đóng form reply
        setReplyContent("");
    };

    const handleCancelReply = () => {
        setReplyingTo(null);
        setReplyContent("");
    };

    const submitReply = (e: FormEvent) => {
        e.preventDefault();
        if (!replyContent.trim()) return;
        onReplySubmit(comment._id, replyContent.trim());
    };

    return (
        <div className="border-b last:border-b-0 py-2">
            {/* Thông tin bình luận */}
            <div className="font-semibold text-sm">{comment.userFullName || "Người dùng"}</div>
            <div className="text-gray-800 text-base my-1">{comment.content}</div>
            <div className="flex items-center space-x-3 text-xs text-gray-500">
                <span>{new Date(comment.createdAt).toLocaleString('vi-VN')}</span>
                <button
                    onClick={handleReplyClick}
                    className="hover:text-blue-600 font-medium disabled:text-gray-400"
                    disabled={!!replyingTo && !isReplying} // Disable nếu đang mở form khác
                >
                    {isReplying ? "Hủy trả lời" : "Phản hồi"}
                </button>
                {/* TODO: Thêm nút Sửa/Xóa nếu cần */}
            </div>

            {/* Form trả lời */}
            {isReplying && (
                <form onSubmit={submitReply} className="ml-6 mt-2 pl-2 border-l-2 border-gray-200">
                    <textarea
                        className="w-full border rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                        value={replyContent}
                        onChange={e => setReplyContent(e.target.value)}
                        placeholder={`Trả lời ${comment.userFullName}...`}
                        disabled={isPostingReply}
                        required
                        autoFocus // Tự động focus vào textarea khi form hiện ra
                    />
                    <div className="mt-1 space-x-2">
                        <button
                            type="submit"
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-60"
                            disabled={isPostingReply || !replyContent.trim()}
                        >
                            {isPostingReply ? "Đang gửi..." : "Gửi"}
                        </button>
                        <button
                            type="button"
                            className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                            onClick={handleCancelReply}
                            disabled={isPostingReply}
                        >
                            Hủy
                        </button>
                    </div>
                </form>
            )}

            {/* Render các phản hồi (đệ quy) */}
            {replies.length > 0 && (
                <div className="ml-6 mt-2 pl-2 border-l-2 border-gray-200 space-y-2">
                    {replies.map(reply => (
                        <CommentItem
                            key={reply._id}
                            comment={reply}
                            allComments={allComments}
                            onReplySubmit={onReplySubmit}
                            replyingTo={replyingTo}
                            setReplyingTo={setReplyingTo}
                            replyContent={replyContent}
                            setReplyContent={setReplyContent}
                            isPostingReply={isPostingReply}
                            currentUserId={currentUserId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}


// --- Component con: CommentSection ---

function CommentSection({ musicId }: { musicId: string }) {
    const { data: session, status } = useSession();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [rootContent, setRootContent] = useState("");
    const [isPostingRoot, setIsPostingRoot] = useState(false);
    const [postError, setPostError] = useState<string | null>(null); // Lỗi cho form gốc

    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState("");
    const [isPostingReply, setIsPostingReply] = useState(false);
    const [replyError, setReplyError] = useState<string | null>(null); // Lỗi cho form reply (có thể hiển thị chung)

    useEffect(() => {
        if (!musicId) return; // Không fetch nếu chưa có musicId

        setLoading(true);
        setError(null);
        fetch(`/api/music/${musicId}/comments`)
            .then(res => {
                if (!res.ok) throw new Error("Lỗi mạng khi tải bình luận");
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    // Sắp xếp để đảm bảo thứ tự hiển thị hợp lý (có thể không cần nếu backend đã sort)
                    const sortedData = data.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                    setComments(sortedData);
                } else {
                    setError(data.error || "Dữ liệu bình luận không hợp lệ");
                    setComments([]); // Reset comments nếu data lỗi
                }
            })
            .catch((err) => {
                setError(err.message || "Lỗi khi tải bình luận");
                setComments([]); // Reset comments khi có lỗi fetch
            })
            .finally(() => setLoading(false));
    }, [musicId]);

    const handleRootSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setPostError(null);
        if (!rootContent.trim()) {
            setPostError("Nội dung không được để trống");
            return;
        }
        setIsPostingRoot(true);
        try {
            const res = await fetch(`/api/music/${musicId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: rootContent.trim() }), // Không có parentId
            });
            const data = await res.json();
            if (res.ok && data?._id) { // Kiểm tra data có _id không
                // Thêm vào đầu danh sách hoặc cuối tùy logic hiển thị mong muốn
                setComments(prev => [data, ...prev]);
                setRootContent("");
            } else {
                setPostError(data.error || "Lỗi khi gửi bình luận");
            }
        } catch (err: any) {
            setPostError(err.message || "Lỗi khi gửi bình luận");
        } finally {
            setIsPostingRoot(false);
        }
    };

    const handleReplySubmit = async (parentId: string, content: string) => {
        setIsPostingReply(true);
        setReplyError(null); // Reset lỗi reply
        try {
            const res = await fetch(`/api/music/${musicId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content, parentId }),
            });
            const data = await res.json();
            if (res.ok && data?._id) { // Kiểm tra data có _id không
                // Thêm vào danh sách phẳng, việc sắp xếp lại nếu cần sẽ do logic render xử lý
                setComments(prev => [...prev, data]);
                setReplyingTo(null);
                setReplyContent("");
            } else {
                // Hiển thị lỗi chung hoặc gần form reply (hiện đang dùng lỗi chung)
                setReplyError(`Lỗi khi trả lời: ${data.error || "Lỗi không xác định"}`);
            }
        } catch (err: any) {
            setReplyError(`Lỗi khi trả lời: ${err.message || "Lỗi không xác định"}`);
        } finally {
            setIsPostingReply(false);
        }
    };

    const rootComments = comments.filter(comment => !comment.parentId);

    return (
        <div className="mt-8 bg-white shadow-md rounded-lg p-4 md:p-6">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Bình luận ({comments.length})</h2>

            {/* Form gửi bình luận gốc */}
            {status === 'authenticated' && session?.user ? (
                <form onSubmit={handleRootSubmit} className="mb-6">
                    <textarea
                        className="w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        value={rootContent}
                        onChange={e => setRootContent(e.target.value)}
                        placeholder="Viết bình luận của bạn..."
                        disabled={isPostingRoot}
                        required
                    />
                    {/* Hiển thị lỗi của form gốc */}
                    {postError && <div className="text-red-600 text-sm mt-1">{postError}</div>}
                    <button
                        type="submit"
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
                        disabled={isPostingRoot || !rootContent.trim()}
                    >
                        {isPostingRoot ? "Đang gửi..." : "Gửi bình luận"}
                    </button>
                </form>
            ) : status === 'loading' ? (
                <div className="mb-4 text-gray-500 italic">Đang kiểm tra đăng nhập...</div>
            ) : (
                <div className="mb-6 p-3 bg-gray-100 border rounded text-center">
                    <Link href="/login" className="text-blue-600 hover:underline font-medium">
                        Đăng nhập
                    </Link>
                    <span className="text-gray-600"> để bình luận.</span>
                </div>
            )}

            {/* Hiển thị lỗi của form reply (nếu có) */}
            {replyError && <div className="text-red-600 text-sm mb-2">{replyError}</div>}

            {/* Hiển thị danh sách bình luận */}
            {loading ? (
                <div>Đang tải bình luận...</div>
            ) : error ? (
                <div className="text-red-600">{error}</div>
            ) : (
                <div className="space-y-3">
                    {rootComments.length === 0 ? (
                        <div className="text-gray-500 text-center py-4">Chưa có bình luận nào. Hãy là người đầu tiên!</div>
                    ) : (
                        rootComments.map((rootComment) => (
                            <CommentItem
                                key={rootComment._id}
                                comment={rootComment}
                                allComments={comments}
                                onReplySubmit={handleReplySubmit}
                                replyingTo={replyingTo}
                                setReplyingTo={setReplyingTo}
                                replyContent={replyContent}
                                setReplyContent={setReplyContent}
                                isPostingReply={isPostingReply}
                                currentUserId={session?.user?.id}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}


// --- Component chính: MusicDetailPage ---

export default function MusicDetailPage() {
    const params = useParams();
    const id = params?.id as string | undefined; // Lấy id, có thể là undefined ban đầu
    const [music, setMusic] = useState<MusicDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Chỉ fetch khi có id hợp lệ
        if (id && typeof id === 'string') {
            setIsLoading(true);
            setError(null);
            setMusic(null); // Reset music state khi id thay đổi

            fetch(`/api/music/${id}`)
                .then(res => {
                    if (!res.ok) {
                        // Cố gắng đọc lỗi từ response nếu có thể
                        return res.json().then(errData => {
                            throw new Error(errData.error || `Lỗi mạng (status: ${res.status})`);
                        }).catch(() => {
                            // Nếu không đọc được json lỗi, ném lỗi chung
                            throw new Error(`Lỗi mạng (status: ${res.status})`);
                        });
                    }
                    return res.json();
                })
                .then(data => {
                    // API có thể trả về { music: ... } hoặc chỉ { ... }
                    const musicData = data.music || data;
                    if (musicData && musicData._id) {
                        setMusic(musicData);
                    } else {
                        console.error("Dữ liệu bài hát không hợp lệ:", data);
                        setError("Không tìm thấy dữ liệu bài hát hợp lệ.");
                    }
                })
                .catch(err => {
                    console.error('Lỗi fetch chi tiết nhạc:', err);
                    setError(err.message || "Đã xảy ra lỗi khi tải chi tiết bài hát.");
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else if (params?.id) { // Nếu params.id có tồn tại nhưng không phải string hợp lệ
            setError("ID bài hát không hợp lệ.");
            setIsLoading(false);
        } else {
            // Trường hợp không có ID trong params ngay từ đầu (ví dụ SSR/SSG chưa xong)
            setIsLoading(true); // Có thể vẫn đang chờ ID từ router
        }
    }, [id, params?.id]); // Thêm params?.id vào dependencies

    // --- Phần Render ---

    if (isLoading) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-8 text-center">Đang tải chi tiết nhạc...</div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-8 text-center text-red-600">Lỗi: {error}</div>
            </Layout>
        );
    }

    if (music) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-8">
                    {/* Phần thông tin bài hát và player */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">{music.title}</h1>
                        <p className="text-lg text-gray-600 mb-4">{music.artist}</p>
                        <MusicPlayer
                            title={music.title}
                            artist={music.artist}
                            image={music.image}
                            audio={music.audio}
                        // description={music.description} // MusicPlayer có cần description không?
                        />
                        {music.description && (
                            <div className="mt-4 prose max-w-none">
                                <p>{music.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Phần bình luận */}
                    <CommentSection musicId={music._id} />
                </div>
            </Layout>
        );
    }

    // Trường hợp không loading, không error, không music
    return (
        <Layout>
            <div className="container mx-auto px-4 py-8 text-center">Không tìm thấy thông tin bài hát.</div>
        </Layout>
    );
}