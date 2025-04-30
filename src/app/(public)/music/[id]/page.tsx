// src/app/(public)/music/[id]/page.tsx (Ví dụ về đường dẫn)
'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import Link from 'next/link';
import Layout from '@/components/layout/Layout';        // Đảm bảo đường dẫn đúng
import MusicPlayer from '@/components/ui/MusicPlayer';  // Đảm bảo đường dẫn đúng
// Icons
import { FaReply } from 'react-icons/fa'; // Chỉ cần icon Reply
import { IoSend } from "react-icons/io5";
import { MdCancel } from "react-icons/md";

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
    // userAvatar?: string | null; // Đã loại bỏ avatar khỏi interface (tùy chọn)
    createdAt: string; // ISO date string
    musicId: string;
    parentId?: string | null;
}


// --- Component con: CommentItem (Đã bỏ Avatar) ---

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
    // const defaultAvatar = '/images/default-avatar.png'; // Không cần nữa

    const replies = allComments
        .filter(c => c.parentId === comment._id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const handleReplyClick = () => {
        if (!session) {
            alert("Bạn cần đăng nhập để phản hồi.");
            return;
        }
        setReplyingTo(isReplying ? null : comment._id);
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

    const formattedDate = new Date(comment.createdAt).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
        // Container cho một bình luận - Bỏ flex và space-x
        <div className="py-4 border-b border-gray-100 last:border-b-0">
            {/* Nội dung chính của bình luận */}
            <div className="flex-grow"> {/* Vẫn giữ flex-grow nếu cần cho layout phức tạp hơn sau này */}
                {/* Tên người dùng và thời gian */}
                <div className="flex items-baseline space-x-2 mb-1">
                    <span className="font-semibold text-sm text-gray-800 hover:text-indigo-600 cursor-pointer">
                        {comment.userFullName || "Người dùng ẩn danh"}
                    </span>
                    <span className="text-xs text-gray-400">{formattedDate}</span>
                </div>

                {/* Nội dung bình luận */}
                <div className="text-gray-700 text-sm mb-1 whitespace-pre-wrap">{comment.content}</div>

                {/* Nút hành động (Phản hồi, Sửa, Xóa) */}
                <div className="flex items-center space-x-3 text-xs mt-1"> {/* Thêm mt-1 */}
                    <button
                        onClick={handleReplyClick}
                        className="flex items-center text-gray-500 hover:text-indigo-600 font-medium disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                        disabled={!!replyingTo && !isReplying}
                        aria-label={isReplying ? "Hủy trả lời" : "Phản hồi"}
                    >
                        <FaReply className="inline mr-1" size={12} />
                        {isReplying ? "Hủy" : "Phản hồi"}
                    </button>
                    {/* TODO: Thêm nút Sửa/Xóa */}
                </div>

                {/* Form trả lời */}
                {isReplying && (
                    // Điều chỉnh margin/padding cho form reply
                    <form onSubmit={submitReply} className="mt-3 ml-4 pl-4 border-l-2 border-indigo-100">
                        <textarea
                            className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                            rows={2}
                            value={replyContent}
                            onChange={e => setReplyContent(e.target.value)}
                            placeholder={`Trả lời ${comment.userFullName}...`}
                            disabled={isPostingReply}
                            required
                            autoFocus
                        />
                        <div className="mt-2 flex items-center justify-end space-x-2">
                            <button
                                type="button"
                                className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-300 transition duration-150 ease-in-out flex items-center"
                                onClick={handleCancelReply}
                                disabled={isPostingReply}
                            >
                                <MdCancel className="mr-1" /> Hủy
                            </button>
                            <button
                                type="submit"
                                className="px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition duration-150 ease-in-out flex items-center"
                                disabled={isPostingReply || !replyContent.trim()}
                            >
                                {isPostingReply ? (
                                    <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg>
                                ) : <IoSend className="mr-1" />}
                                Gửi
                            </button>
                        </div>
                    </form>
                )}

                {/* Render các phản hồi (đệ quy) */}
                {replies.length > 0 && (
                    // Điều chỉnh margin/padding cho khu vực replies
                    <div className="mt-4 ml-4 pl-4 border-l-2 border-gray-200 space-y-4">
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
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}


// --- Component con: CommentSection (Giữ nguyên từ trước) ---

function CommentSection({ musicId }: { musicId: string }) {
    const { data: session, status } = useSession();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loadingComments, setLoadingComments] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [rootContent, setRootContent] = useState("");
    const [isPostingRoot, setIsPostingRoot] = useState(false);
    const [postError, setPostError] = useState<string | null>(null);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState("");
    const [isPostingReply, setIsPostingReply] = useState(false);
    const [replyError, setReplyError] = useState<string | null>(null);

    useEffect(() => {
        if (!musicId) return;
        setLoadingComments(true);
        setFetchError(null);
        setComments([]);
        fetch(`/api/music/${musicId}/comments`)
            .then(res => {
                if (!res.ok) throw new Error("Lỗi mạng khi tải bình luận");
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    const sortedData = data.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                    setComments(sortedData);
                } else {
                    setFetchError(data.error || "Dữ liệu bình luận không hợp lệ");
                }
            })
            .catch((err) => {
                setFetchError(err.message || "Lỗi khi tải bình luận");
            })
            .finally(() => setLoadingComments(false));
    }, [musicId]);

    const handleRootSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setPostError(null);
        if (!rootContent.trim()) {
            setPostError("Nội dung bình luận không được để trống.");
            return;
        }
        setIsPostingRoot(true);
        try {
            const res = await fetch(`/api/music/${musicId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: rootContent.trim() }),
            });
            const data = await res.json();
            if (res.ok && data?._id) {
                setComments(prev => [...prev, data]);
                setRootContent("");
            } else {
                setPostError(data.error || "Lỗi khi gửi bình luận");
            }
        } catch (err: any) {
            setPostError(err.message || "Lỗi hệ thống khi gửi bình luận");
        } finally {
            setIsPostingRoot(false);
        }
    };

    const handleReplySubmit = async (parentId: string, content: string) => {
        setIsPostingReply(true);
        setReplyError(null);
        try {
            const res = await fetch(`/api/music/${musicId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content, parentId }),
            });
            const data = await res.json();
            if (res.ok && data?._id) {
                setComments(prev => [...prev, data]);
                setReplyingTo(null);
                setReplyContent("");
            } else {
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
        <div className="mt-10 bg-white rounded-xl shadow-lg p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-3">
                Bình luận <span className="text-base font-normal text-gray-500">({comments.length})</span>
            </h2>
            {status === 'authenticated' && session?.user ? (
                <form onSubmit={handleRootSubmit} className="mb-8">
                    <label htmlFor="rootComment" className="sr-only">Viết bình luận</label>
                    <textarea
                        id="rootComment"
                        className="block w-full border border-gray-300 rounded-md p-3 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                        rows={3}
                        value={rootContent}
                        onChange={e => setRootContent(e.target.value)}
                        placeholder={`Chia sẻ cảm nghĩ của bạn (${session.user.name || 'bạn'})...`}
                        disabled={isPostingRoot}
                        required
                    />
                    {postError && <p className="text-red-600 text-xs mt-1">{postError}</p>}
                    <div className="mt-3 flex justify-end">
                        <button
                            type="submit"
                            className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md shadow hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition duration-150 ease-in-out flex items-center"
                            disabled={isPostingRoot || !rootContent.trim()}
                        >
                            {isPostingRoot ? (
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg>
                            ) : <IoSend className="mr-1.5" />}
                            Gửi bình luận
                        </button>
                    </div>
                </form>
            ) : status === 'loading' ? (
                <div className="mb-6 text-center text-gray-500 italic">Đang kiểm tra đăng nhập...</div>
            ) : (
                <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg text-center shadow-sm">
                    <span className="text-gray-700">Vui lòng </span>
                    <Link href={`/login?callbackUrl=/music/${musicId}`} className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline">
                        đăng nhập
                    </Link>
                    <span className="text-gray-700"> để tham gia bình luận!</span>
                </div>
            )}
            {replyError && <div className="text-red-600 text-sm mb-4 p-3 bg-red-50 border border-red-200 rounded">{replyError}</div>}
            {loadingComments ? (
                <div className="text-center py-6 text-gray-500">Đang tải bình luận...</div>
            ) : fetchError ? (
                <div className="text-center py-6 text-red-600 bg-red-50 p-4 rounded border border-red-200">{fetchError}</div>
            ) : (
                <div className="space-y-4">
                    {rootComments.length === 0 ? (
                        <div className="text-gray-500 text-center py-6 italic">Chưa có bình luận nào. Hãy là người đầu tiên!</div>
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
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}


// --- Component chính: MusicDetailPage (Giữ nguyên từ trước) ---

export default function MusicDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string | undefined;
    const [music, setMusic] = useState<MusicDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id && typeof id === 'string') {
            setIsLoading(true);
            setError(null);
            setMusic(null);
            fetch(`/api/music/${id}`)
                .then(res => {
                    if (!res.ok) {
                        return res.json().then(errData => { throw new Error(errData.error || `Lỗi mạng (status: ${res.status})`); })
                            .catch(() => { throw new Error(`Lỗi mạng (status: ${res.status})`); });
                    }
                    return res.json();
                })
                .then(data => {
                    const musicData = data.music || data;
                    if (musicData && musicData._id) {
                        setMusic(musicData);
                    } else {
                        console.error("Invalid music data structure:", data);
                        setError("Không tìm thấy dữ liệu bài hát hợp lệ.");
                    }
                })
                .catch(err => {
                    console.error("Fetch music detail error:", err);
                    setError(err.message || "Đã xảy ra lỗi khi tải chi tiết bài hát.");
                })
                .finally(() => { setIsLoading(false); });
        } else if (params?.id) {
            setError("ID bài hát không hợp lệ.");
            setIsLoading(false);
        } else {
            setError("Không xác định được ID bài hát.");
            setIsLoading(false); // Cần set loading false ở đây
        }
    }, [id, params?.id]);

    if (isLoading) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-20 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-600">Đang tải chi tiết bài hát...</p>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-12">
                    <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-indigo-600 mb-6 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /> </svg>
                        Quay lại
                    </button>
                    <div className="text-center py-10 bg-red-50 border border-red-200 rounded-lg max-w-lg mx-auto p-6 shadow">
                        <h3 className="text-xl font-semibold text-red-700 mb-2">Không thể tải trang</h3>
                        <p className="text-red-600">{error}</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!music) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-12">
                    <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-indigo-600 mb-6 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /> </svg>
                        Quay lại
                    </button>
                    <div className="text-center py-10 text-gray-500">Không tìm thấy thông tin bài hát này.</div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="bg-gray-50 min-h-screen py-12">
                <div className="container mx-auto px-4">
                    <div className="mb-6">
                        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-indigo-700 font-medium transition-colors duration-150">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /> </svg>
                            Quay lại danh sách nhạc
                        </button>
                    </div>
                    <div className="mb-10 bg-white rounded-xl shadow-lg p-6 md:p-8">
                        <div className="mb-6">
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">{music.title}</h1>
                            <p className="text-lg md:text-xl text-gray-500">{music.artist}</p>
                        </div>
                        <div className="mb-6">
                            <MusicPlayer
                                title={music.title}
                                artist={music.artist}
                                image={music.image}
                                audio={music.audio}
                            />
                        </div>
                        {music.description && (
                            <div className="mt-6 pt-6 border-t border-gray-200 prose prose-sm sm:prose-base max-w-none text-gray-700">
                                <h3 className="text-lg font-semibold mb-2 text-gray-800 not-prose">Giới thiệu</h3>
                                <p>{music.description}</p>
                            </div>
                        )}
                    </div>
                    <CommentSection musicId={music._id} />
                </div>
            </div>
        </Layout>
    );
}