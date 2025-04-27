// /app/admin/comment/page.tsx
'use client';
import { useEffect, useState } from 'react';

// --- Interfaces ---
// Interface cho item trong dropdown (nếu cần cập nhật form Thêm)
interface ReferenceItem {
    _id: string;
    title: string;
    type: 'Music' | 'News'; // Hiện tại chỉ dùng cho Music
}

// Interface cho Comment khớp với dữ liệu từ API GET đã sửa
interface Comment {
    _id: string;
    musicId?: string; // ID bài nhạc (nếu có)
    newsId?: string;  // ID bài viết (nếu có)
    referenceTitle: string; // Tên bài nhạc HOẶC bài viết
    referenceType: 'Music' | 'News' | 'Unknown'; // Loại nội dung
    userFullName: string;
    content: string;
    createdAt: string; // Chuỗi ISO từ API
}

// Interface cho MusicTrack (chỉ dùng cho form Add hiện tại)
interface MusicTrack {
    _id: string;
    title: string;
}

export default function AdminCommentPage() {
    const [comments, setComments] = useState<Comment[]>([]); // Sử dụng interface Comment mới
    const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]); // Giữ nguyên cho form Add hiện tại
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<Comment | null>(null); // Sử dụng interface Comment mới
    const [showAdd, setShowAdd] = useState(false);

    // State cho việc thêm/sửa
    const [newContent, setNewContent] = useState('');
    // State cho form Add (chỉ hỗ trợ Music)
    const [newMusicId, setNewMusicId] = useState<string>('');
    const [newUserFullName, setNewUserFullName] = useState<string>('');

    // 1. Lấy danh sách bình luận (API đã được sửa)
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
            .then((data: Comment[]) => { // API trả về dữ liệu theo interface Comment mới
                setComments(data);
                setError(null);
            })
            .catch((err: Error) => {
                console.error("Lỗi fetch bình luận:", err);
                setError(`Lỗi khi tải bình luận: ${err.message}`);
            })
            .finally(() => setLoading(false));
    }, []);

    // 2. Lấy danh sách bài nhạc cho dropdown (chỉ cho form Add hiện tại)
    useEffect(() => {
        if (showAdd) {
            fetch('/api/admin/music') // Giả sử endpoint này chỉ trả về music
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
                    setError('Lỗi tải danh sách bài nhạc để thêm bình luận.');
                });
        }
    }, [showAdd, newMusicId]); // Dependency giữ nguyên newMusicId

    // Hàm thêm bình luận (giữ nguyên logic chỉ thêm cho Music)
    const handleAdd = async () => {
        if (!newMusicId || !newUserFullName.trim() || !newContent.trim()) {
            alert('Vui lòng chọn bài nhạc, nhập tên người dùng và nội dung.');
            return;
        }
        try {
            const res = await fetch('/api/admin/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    musicId: newMusicId, // Chỉ gửi musicId
                    userFullName: newUserFullName.trim(),
                    content: newContent.trim(),
                }),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Không thể thêm bình luận' }));
                throw new Error(errorData.error || `Lỗi HTTP! status: ${res.status}`);
            }
            const newComment: Comment = await res.json(); // API trả về theo format mới
            setComments([newComment, ...comments]); // Thêm vào đầu danh sách
            // Reset form
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

    // Hàm sửa bình luận (chỉ sửa content)
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
            const updatedCommentData = await res.json(); // API trả về comment đã cập nhật (chỉ có content mới)
            // Cập nhật state, giữ nguyên các trường khác từ editing
            setComments(comments.map(c =>
                c._id === editing._id
                    ? { ...editing, content: updatedCommentData.content || newContent.trim() }
                    : c
            ));
            setEditing(null);
            setNewContent('');
            setError(null);
        } catch (err: any) {
            console.error("Lỗi sửa bình luận:", err);
            setError(`Lỗi khi cập nhật: ${err.message}`);
        }
    };

    // Hàm xóa bình luận (giữ nguyên)
    const handleDelete = async (id: string) => {
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
            <h1 className="text-2xl font-bold mb-4">Quản lý Bình luận</h1>

            {/* Nút Thêm (Ghi rõ chỉ hỗ trợ Music) */}
            <button
                className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                onClick={() => { setShowAdd(true); setEditing(null); setNewContent(''); setNewUserFullName(''); setNewMusicId(musicTracks.length > 0 ? musicTracks[0]._id : ''); }}
                disabled={showAdd || !!editing}
            >
                + Thêm Bình luận (cho Bài nhạc)
            </button>

            {error && !loading && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded">{error}</div>}

            {/* Form Thêm (Hiện chỉ hỗ trợ Music) */}
            {showAdd && (
                <div className="mb-6 p-4 border rounded shadow-md bg-gray-50">
                    <h2 className="text-xl font-semibold mb-3">Bình luận Mới (cho Bài nhạc)</h2>
                    <div className="mb-3">
                        <label htmlFor="musicSelect" className="block text-sm font-medium text-gray-700 mb-1">Bài nhạc:</label>
                        <select
                            id="musicSelect"
                            className="w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                            value={newMusicId}
                            onChange={e => setNewMusicId(e.target.value)}
                            required
                        >
                            <option value="" disabled>-- Chọn bài nhạc --</option>
                            {musicTracks.map(track => (
                                <option key={track._id} value={track._id}>
                                    {track.title}
                                </option>
                            ))}
                            {musicTracks.length === 0 && <option disabled>Đang tải...</option>}
                        </select>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="userNameInput" className="block text-sm font-medium text-gray-700 mb-1">Tên người dùng:</label>
                        <input
                            type="text"
                            id="userNameInput"
                            className="w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                            value={newUserFullName}
                            onChange={e => setNewUserFullName(e.target.value)}
                            placeholder="Họ và tên"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="contentInputAdd" className="block text-sm font-medium text-gray-700 mb-1">Nội dung:</label>
                        <textarea
                            id="contentInputAdd"
                            className="w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                            value={newContent}
                            onChange={e => setNewContent(e.target.value)}
                            placeholder="Nội dung bình luận"
                            required
                        />
                    </div>
                    <button className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" onClick={handleAdd}>
                        Lưu
                    </button>
                    <button className="mt-2 ml-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500" onClick={() => setShowAdd(false)}>
                        Hủy
                    </button>
                </div>
            )}

            {/* Form Sửa */}
            {editing && (
                <div className="mb-6 p-4 border rounded shadow-md bg-gray-50">
                    <h2 className="text-xl font-semibold mb-3">Sửa Bình luận</h2>
                    {/* Hiển thị referenceTitle và referenceType */}
                    <p className="text-sm text-gray-600 mb-1">
                        Nơi bình luận ({editing.referenceType}): <span className="font-medium">{editing.referenceTitle}</span>
                    </p>
                    <p className="text-sm text-gray-600 mb-3">Người dùng: <span className="font-medium">{editing.userFullName}</span></p>
                    <div className="mb-3">
                        <label htmlFor="contentInputEdit" className="block text-sm font-medium text-gray-700 mb-1">Nội dung:</label>
                        <textarea
                            id="contentInputEdit"
                            className="w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                            value={newContent}
                            onChange={e => setNewContent(e.target.value)}
                            placeholder="Sửa nội dung bình luận"
                            required
                        />
                    </div>
                    <button className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600" onClick={handleEdit}>
                        Cập nhật
                    </button>
                    <button className="mt-2 ml-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500" onClick={() => { setEditing(null); setNewContent(''); }}>
                        Hủy
                    </button>
                </div>
            )}

            {/* Bảng hiển thị bình luận */}
            {loading ? (
                <div className="text-center py-10">Đang tải bình luận...</div>
            ) : comments.length === 0 && !error ? (
                <div className="text-center py-10 text-gray-500">Không tìm thấy bình luận nào.</div>
            ) : !error ? (
                <div className="bg-white rounded-lg shadow overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {/* === ĐỔI TÊN CỘT ĐẦU TIÊN === */}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nơi bình luận
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
                                    {/* === HIỂN THỊ referenceTitle === */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800" title={`Loại: ${c.referenceType} | MusicID: ${c.musicId || 'N/A'} | NewsID: ${c.newsId || 'N/A'}`}>
                                        {c.referenceTitle || <span className="text-gray-400 italic">Không rõ</span>}
                                        {/* Optional: Thêm tag nhỏ để phân biệt */}
                                        {c.referenceType === 'Music' && <span className="ml-1 text-xs text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">Nhạc</span>}
                                        {c.referenceType === 'News' && <span className="ml-1 text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded">Tin tức</span>}
                                        _                            </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                        {c.userFullName}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-800 break-words max-w-xs">
                                        {c.content}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(c.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-indigo-600 hover:text-indigo-900 mr-3 disabled:opacity-50 disabled:cursor-not-allowed"
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
            ) : null}
        </div>
    );
}