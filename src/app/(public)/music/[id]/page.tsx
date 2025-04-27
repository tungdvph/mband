'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Script from 'next/script'; // Nhập Next.js Script component
import Layout from '@/components/layout/Layout';
import MusicPlayer from '@/components/ui/MusicPlayer';
import { useSession } from "next-auth/react";

// Định nghĩa kiểu dữ liệu cho chi tiết nhạc
interface MusicDetail {
    _id: string;
    title: string;
    artist: string;
    image?: string;
    audio: string;
    description?: string;
}

export default function MusicDetailPage() {
    const params = useParams();
    const id = params?.id as string; // Lấy id từ params một cách an toàn
    const [music, setMusic] = useState<MusicDetail | null>(null);
    const [pageUrl, setPageUrl] = useState('');
    const [isLoading, setIsLoading] = useState(true); // Thêm state cho trạng thái tải
    const [error, setError] = useState<string | null>(null); // Thêm state cho lỗi

    // Lấy dữ liệu nhạc từ API
    useEffect(() => {
        // Reset trạng thái khi id thay đổi
        setIsLoading(true);
        setError(null);
        setMusic(null);

        if (id) {
            fetch(`/api/music/${id}`)
                .then(res => {
                    if (!res.ok) {
                        // Ném lỗi cụ thể hơn dựa trên status code nếu có thể
                        throw new Error(`Network response was not ok (status: ${res.status})`);
                    }
                    return res.json();
                })
                .then(data => {
                    const musicData = data.music || data; // Xử lý cả hai cấu trúc trả về có thể có
                    if (musicData && musicData._id) {
                        setMusic(musicData);
                    } else {
                        console.error("Invalid music data received:", data);
                        setError("Không tìm thấy dữ liệu bài hát hợp lệ.");
                        setMusic(null);
                    }
                })
                .catch(err => {
                    console.error('Error fetching music details:', err);
                    setError(err.message || "Đã xảy ra lỗi khi tải chi tiết bài hát.");
                    setMusic(null);
                })
                .finally(() => {
                    setIsLoading(false); // Kết thúc trạng thái tải dù thành công hay thất bại
                });
        } else {
            setIsLoading(false); // Không có id, không cần tải
            setError("ID bài hát không hợp lệ.");
        }
    }, [id]); // Dependency array chỉ chứa id

    // Lấy URL trang hiện tại khi component được mount phía client
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setPageUrl(window.location.href);
        }
    }, []); // Chạy một lần sau khi mount

    // --- Phần hiển thị ---

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

    // Đã tải xong và có dữ liệu music
    if (music) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold mb-4">{music.title}</h1>
                    <MusicPlayer
                        title={music.title}
                        artist={music.artist}
                        image={music.image}
                        audio={music.audio}
                        description={music.description}
                    />
                    <CommentSection musicId={music._id} />
                </div>
            </Layout>
        );
    }

    // Trường hợp không loading, không error nhưng cũng không có music (hiếm khi xảy ra nếu logic fetch đúng)
    return (
        <Layout>
            <div className="container mx-auto px-4 py-8 text-center">Không thể hiển thị chi tiết bài hát.</div>
        </Layout>
    );
}

function CommentSection({ musicId }: { musicId: string }) {
    const { data: session, status } = useSession();
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [content, setContent] = useState("");
    const [posting, setPosting] = useState(false);
    const [postError, setPostError] = useState<string | null>(null);

    // Lấy danh sách bình luận
    useEffect(() => {
        setLoading(true);
        setError(null);
        fetch(`/api/music/${musicId}/comments`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setComments(data);
                else setError(data.error || "Lỗi khi tải bình luận");
            })
            .catch(() => setError("Lỗi khi tải bình luận"))
            .finally(() => setLoading(false));
    }, [musicId]);

    // Gửi bình luận mới
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPostError(null);
        if (!content.trim()) {
            setPostError("Nội dung không được để trống");
            return;
        }
        setPosting(true);
        try {
            const res = await fetch(`/api/music/${musicId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            });
            const data = await res.json();
            if (res.ok) {
                setComments([data, ...comments]);
                setContent("");
            } else {
                setPostError(data.error || "Lỗi khi gửi bình luận");
            }
        } catch {
            setPostError("Lỗi khi gửi bình luận");
        } finally {
            setPosting(false);
        }
    };

    return (
        <div className="mt-8">
            <h2 className="text-xl font-semibold mb-2">Bình luận</h2>
            {loading ? (
                <div>Đang tải bình luận...</div>
            ) : error ? (
                <div className="text-red-600">{error}</div>
            ) : (
                <>
                    {session?.user ? (
                        <form onSubmit={handleSubmit} className="mb-4">
                            <textarea
                                className="w-full border rounded p-2"
                                rows={3}
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                placeholder="Nhập bình luận của bạn..."
                                disabled={posting}
                            />
                            {postError && <div className="text-red-600 text-sm mt-1">{postError}</div>}
                            <button
                                type="submit"
                                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
                                disabled={posting}
                            >
                                {posting ? "Đang gửi..." : "Gửi bình luận"}
                            </button>
                        </form>
                    ) : (
                        <div className="mb-4 text-gray-500">Bạn cần đăng nhập để bình luận.</div>
                    )}
                    <div className="space-y-4">
                        {comments.length === 0 ? (
                            <div>Chưa có bình luận nào.</div>
                        ) : (
                            comments.map((c) => (
                                <div key={c._id} className="border-b pb-2">
                                    <div className="font-semibold">{c.userFullName || "Người dùng"}</div>
                                    <div className="text-gray-700">{c.content}</div>
                                    <div className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
}