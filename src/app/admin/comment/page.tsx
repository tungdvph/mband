'use client';
import { useEffect, useState } from 'react';

// Interface cho bản nhạc (giữ nguyên)
interface MusicTrack {
    _id: string;
    title: string;
}

// Interface cho bình luận (giữ nguyên)
interface Comment {
    _id: string;
    musicId: string; // ID của bài nhạc
    musicTitle?: string; // Tên bài nhạc (có thể thiếu ban đầu)
    userFullName: string;
    content: string;
    createdAt: string; // Chuỗi ISO từ API
}

export default function AdminCommentPage() {
    const [comments, setComments] = useState<Comment[]>([]);
    const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<Comment | null>(null);
    const [showAdd, setShowAdd] = useState(false);

    // State cho việc thêm bình luận mới
    const [newContent, setNewContent] = useState('');
    const [newMusicId, setNewMusicId] = useState<string>('');
    const [newUserFullName, setNewUserFullName] = useState<string>('');

    // 1. Lấy danh sách bình luận
    useEffect(() => {
        setLoading(true);
        fetch('/api/admin/comments')
            .then(async (res) => {
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({ error: 'Lỗi không xác định khi tải' }));
                    throw new Error(errorData.error || `Lỗi HTTP! status: ${res.status}`);
                }
                return res.json();
            })
            .then((data: Comment[]) => {
                setComments(data);
                setError(null);
            })
            .catch((err: Error) => {
                console.error("Lỗi fetch bình luận:", err);
                setError(`Lỗi khi tải bình luận: ${err.message}`);
            })
            .finally(() => setLoading(false));
    }, []);

    // 2. Lấy danh sách bài nhạc cho dropdown (chỉ khi form Thêm hiện)
    useEffect(() => {
        if (showAdd) {
            // TODO: Implement API endpoint /api/admin/music
            fetch('/api/admin/music') // Đảm bảo endpoint này tồn tại và hoạt động
                .then(res => {
                    if (!res.ok) throw new Error('Không thể tải danh sách bài nhạc');
                    return res.json();
                })
                .then((data: MusicTrack[]) => {
                    setMusicTracks(data);
                    if (data.length > 0 && !newMusicId) {
                        setNewMusicId(data[0]._id); // Chọn bài đầu tiên mặc định
                    }
                })
                .catch(err => {
                    console.error("Lỗi fetch bài nhạc:", err);
                    // Có thể thêm setError ở đây để thông báo lỗi tải bài nhạc
                });
        }
    }, [showAdd, newMusicId]);

    // Hàm thêm bình luận
    const handleAdd = async () => {
        if (!newMusicId || !newUserFullName.trim() || !newContent.trim()) {
            alert('Vui lòng chọn bài nhạc, nhập tên người dùng và nội dung.'); // Tiếng Việt
            return;
        }
        try {
            const res = await fetch('/api/admin/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    musicId: newMusicId,
                    userFullName: newUserFullName.trim(),
                    content: newContent.trim(),
                }),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Không thể thêm bình luận' }));
                throw new Error(errorData.error || `Lỗi HTTP! status: ${res.status}`);
            }
            const newComment: Comment = await res.json();
            setComments([newComment, ...comments]);
            setNewContent('');
            setNewUserFullName('');
            setNewMusicId(musicTracks.length > 0 ? musicTracks[0]._id : '');
            setShowAdd(false);
            setError(null);
        } catch (err: any) {
            console.error("Lỗi thêm bình luận:", err);
            setError(`Lỗi khi thêm: ${err.message}`);
        }
    };

    // Hàm sửa bình luận
    const handleEdit = async () => {
        if (!editing || !newContent.trim()) return;
        try {
            const res = await fetch(`/api/admin/comments/${editing._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newContent.trim() }),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Không thể cập nhật bình luận' }));
                throw new Error(errorData.error || `Lỗi HTTP! status: ${res.status}`);
            }
            // Giả định API trả về comment đã cập nhật đầy đủ
            const updatedComment = await res.json();
            setComments(comments.map(c => c._id === editing._id ? { ...c, ...updatedComment, content: newContent.trim() } : c));
            setEditing(null);
            setNewContent('');
            setError(null);
        } catch (err: any) {
            console.error("Lỗi sửa bình luận:", err);
            setError(`Lỗi khi cập nhật: ${err.message}`);
        }
    };

    // Hàm xóa bình luận
    const handleDelete = async (id: string) => {
        // Sử dụng confirm tiếng Việt
        if (!window.confirm('Bạn chắc chắn muốn xóa bình luận này?')) return;
        try {
            const res = await fetch(`/api/admin/comments/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Không thể xóa bình luận' }));
                throw new Error(errorData.error || `Lỗi HTTP! status: ${res.status}`);
            }
            setComments(comments.filter(c => c._id !== id));
            setError(null);
        } catch (err: any) {
            console.error("Lỗi xóa bình luận:", err);
            setError(`Lỗi khi xóa: ${err.message}`);
        }
    };

    // Render JSX
    return (
        <div>
            {/* Tiêu đề trang */}
            <h1 className="text-2xl font-bold mb-4">Quản lý Bình luận</h1>

            {/* Nút Thêm */}
            <button
                className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                onClick={() => { setShowAdd(true); setEditing(null); setNewContent(''); setNewUserFullName(''); setNewMusicId(musicTracks.length > 0 ? musicTracks[0]._id : ''); }}
                disabled={showAdd || !!editing}
            >
                Thêm Bình luận
            </button>

            {/* Hiển thị lỗi chung */}
            {error && !loading && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded">{error}</div>}

            {/* Form Thêm */}
            {showAdd && (
                <div className="mb-6 p-4 border rounded shadow-md bg-gray-50">
                    <h2 className="text-xl font-semibold mb-3">Bình luận Mới</h2>
                    <div className="mb-3">
                        <label htmlFor="musicSelect" className="block text-sm font-medium text-gray-700 mb-1">Bài nhạc:</label> {/* Tiếng Việt */}
                        <select
                            id="musicSelect"
                            className="w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                            value={newMusicId}
                            onChange={e => setNewMusicId(e.target.value)}
                            required
                        >
                            <option value="" disabled>-- Chọn bài nhạc --</option> {/* Tiếng Việt */}
                            {musicTracks.map(track => (
                                <option key={track._id} value={track._id}>
                                    {track.title}
                                </option>
                            ))}
                            {musicTracks.length === 0 && <option disabled>Đang tải...</option>} {/* Tiếng Việt */}
                        </select>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="userNameInput" className="block text-sm font-medium text-gray-700 mb-1">Tên người dùng:</label> {/* Tiếng Việt */}
                        <input
                            type="text"
                            id="userNameInput"
                            className="w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                            value={newUserFullName}
                            onChange={e => setNewUserFullName(e.target.value)}
                            placeholder="Họ và tên" // Tiếng Việt
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="contentInputAdd" className="block text-sm font-medium text-gray-700 mb-1">Nội dung:</label> {/* Tiếng Việt */}
                        <textarea
                            id="contentInputAdd"
                            className="w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                            value={newContent}
                            onChange={e => setNewContent(e.target.value)}
                            placeholder="Nội dung bình luận" // Tiếng Việt
                            required
                        />
                    </div>
                    <button className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" onClick={handleAdd}>
                        Lưu {/* Tiếng Việt */}
                    </button>
                    <button className="mt-2 ml-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500" onClick={() => setShowAdd(false)}>
                        Hủy {/* Tiếng Việt */}
                    </button>
                </div>
            )}

            {/* Form Sửa */}
            {editing && (
                <div className="mb-6 p-4 border rounded shadow-md bg-gray-50">
                    <h2 className="text-xl font-semibold mb-3">Sửa Bình luận</h2> {/* Tiếng Việt */}
                    <p className="text-sm text-gray-600 mb-1">Bài nhạc: {editing.musicTitle || 'Không rõ'}</p> {/* Tiếng Việt */}
                    <p className="text-sm text-gray-600 mb-3">Người dùng: {editing.userFullName}</p> {/* Tiếng Việt */}
                    <div className="mb-3">
                        <label htmlFor="contentInputEdit" className="block text-sm font-medium text-gray-700 mb-1">Nội dung:</label> {/* Tiếng Việt */}
                        <textarea
                            id="contentInputEdit"
                            className="w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                            value={newContent}
                            onChange={e => setNewContent(e.target.value)}
                            placeholder="Sửa nội dung bình luận" // Tiếng Việt
                            required
                        />
                    </div>
                    <button className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600" onClick={handleEdit}>
                        Cập nhật {/* Tiếng Việt */}
                    </button>
                    <button className="mt-2 ml-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500" onClick={() => { setEditing(null); setNewContent(''); }}>
                        Hủy {/* Tiếng Việt */}
                    </button>
                </div>
            )}

            {/* Bảng hiển thị bình luận */}
            {loading ? (
                <div className="text-center py-10">Đang tải bình luận...</div> // Tiếng Việt
            ) : comments.length === 0 && !error ? (
                <div className="text-center py-10 text-gray-500">Không tìm thấy bình luận nào.</div> // Tiếng Việt
            ) : !error ? (
                <div className="bg-white rounded-lg shadow overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {/* Tiêu đề cột tiếng Việt */}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Bài nhạc
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Người dùng
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nội dung
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ngày tạo
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Hành động
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {comments.map(c => (
                                <tr key={c._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800" title={c.musicId}>
                                        {c.musicTitle || <span className="text-gray-400 italic">Không rõ</span>} {/* Tiếng Việt */}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                        {c.userFullName}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-800 break-words max-w-xs">
                                        {c.content}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {/* Sử dụng locale 'vi-VN' cho tiếng Việt */}
                                        {new Date(c.createdAt).toLocaleString('vi-VN')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {/* Nút chức năng tiếng Việt */}
                                        <button className="text-blue-600 hover:text-blue-900 mr-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={() => { setEditing(c); setNewContent(c.content); setShowAdd(false); }}
                                            disabled={!!editing || showAdd}
                                        >
                                            Sửa
                                        </button>
                                        <button className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={() => handleDelete(c._id)}
                                            disabled={!!editing || showAdd}
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null /* Lỗi đã hiển thị ở trên */}
        </div>
    );
}