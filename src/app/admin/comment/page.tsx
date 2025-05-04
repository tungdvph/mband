// /app/admin/comment/page.tsx
'use client';
import { useEffect, useState, useMemo } from 'react'; // Thêm useMemo
import { format } from 'date-fns'; // Import date-fns để định dạng ngày
import { vi } from 'date-fns/locale/vi'; // Import locale tiếng Việt

// --- Interfaces ---
interface ReferenceItem {
    _id: string;
    title: string;
    type: 'Music' | 'News';
}

interface Comment {
    _id: string;
    musicId?: string;
    newsId?: string;
    referenceTitle: string;
    referenceType: 'Music' | 'News' | 'Unknown';
    userFullName: string;
    content: string;
    createdAt: string;
}

interface MusicTrack {
    _id: string;
    title: string;
}

export default function AdminCommentPage() {
    const [comments, setComments] = useState<Comment[]>([]);
    const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<Comment | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [searchTerm, setSearchTerm] = useState(''); // State tìm kiếm

    // State cho việc thêm/sửa
    const [newContent, setNewContent] = useState('');
    // State cho form Add (chỉ hỗ trợ Music)
    const [newMusicId, setNewMusicId] = useState<string>('');
    const [newUserFullName, setNewUserFullName] = useState<string>('');

    // 1. Lấy danh sách bình luận
    useEffect(() => {
        setLoading(true);
        fetch('/api/admin/comments') // API lấy comments đã bao gồm thông tin reference
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

    // 2. Lấy danh sách bài nhạc cho dropdown (chỉ cho form Add hiện tại)
    useEffect(() => {
        if (showAdd) {
            fetch('/api/admin/music') // Endpoint trả về music (chỉ cần _id và title)
                .then(res => {
                    if (!res.ok) throw new Error('Không thể tải danh sách bài nhạc');
                    return res.json();
                })
                .then((data: MusicTrack[]) => {
                    setMusicTracks(data);
                    // Chỉ set giá trị mặc định nếu chưa có giá trị và có danh sách trả về
                    if (data.length > 0 && !newMusicId) {
                        setNewMusicId(data[0]._id);
                    } else if (data.length === 0) {
                        // Nếu không có bài nhạc nào, reset newMusicId
                        setNewMusicId('');
                    }
                })
                .catch(err => {
                    console.error("Lỗi fetch bài nhạc:", err);
                    setError('Lỗi tải danh sách bài nhạc để thêm bình luận.');
                });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showAdd]); // Chỉ phụ thuộc showAdd để tránh gọi lại không cần thiết

    // === HÀM FORMAT ===
    const formatReferenceType = (type: Comment['referenceType']): string => {
        switch (type) {
            case 'Music': return 'Nhạc';
            case 'News': return 'Tin tức';
            default: return 'Không rõ';
        }
    }

    const formatDateTime = (dateString: string | Date | undefined | null): string => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Ngày không hợp lệ';
            }
            return format(date, 'dd/MM/yyyy HH:mm', { locale: vi });
        } catch (e) {
            console.error("Error formatting date:", e);
            return 'Ngày không hợp lệ';
        }
    }

    // === LOGIC TÌM KIẾM ===
    const filteredComments = useMemo(() => {
        if (!searchTerm) {
            return comments;
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return comments.filter(comment =>
            comment.referenceTitle.toLowerCase().includes(lowerCaseSearchTerm) ||
            formatReferenceType(comment.referenceType).toLowerCase().includes(lowerCaseSearchTerm) ||
            comment.userFullName.toLowerCase().includes(lowerCaseSearchTerm) ||
            comment.content.toLowerCase().includes(lowerCaseSearchTerm)
        );
    }, [comments, searchTerm]);

    // === HÀM HANDLER (ADD, EDIT, DELETE) ===
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
            setComments([newComment, ...comments]); // Thêm vào đầu danh sách
            // Reset form Add
            setShowAdd(false);
            setNewContent('');
            setNewUserFullName('');
            setNewMusicId(''); // Reset luôn musicId
            setError(null);
            alert('Thêm bình luận thành công!');
        } catch (err: any) {
            console.error("Lỗi thêm bình luận:", err);
            setError(`Lỗi khi thêm: ${err.message}`);
            alert(`Lỗi khi thêm: ${err.message}`);
        }
    };

    const handleEdit = async () => {
        if (!editing || !newContent.trim()) return;
        try {
            const res = await fetch(`/api/admin/comments/${editing._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newContent.trim() }), // Chỉ gửi content
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Không thể cập nhật bình luận' }));
                throw new Error(errorData.error || `Lỗi HTTP! status: ${res.status}`);
            }
            const updatedCommentData = await res.json(); // API chỉ trả về phần đã update hoặc toàn bộ comment mới
            // Cập nhật state hiệu quả hơn
            setComments(prevComments => prevComments.map(c =>
                c._id === editing._id
                    ? { ...c, content: updatedCommentData.content ?? newContent.trim() } // Dùng ?? để fallback nếu API không trả content
                    : c
            ));
            // Reset form Edit
            setEditing(null);
            setNewContent('');
            setError(null);
            alert('Cập nhật bình luận thành công!');
        } catch (err: any) {
            console.error("Lỗi sửa bình luận:", err);
            setError(`Lỗi khi cập nhật: ${err.message}`);
            alert(`Lỗi khi cập nhật: ${err.message}`);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Bạn chắc chắn muốn xóa bình luận này?')) return;
        try {
            const res = await fetch(`/api/admin/comments/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Không thể xóa bình luận' }));
                throw new Error(errorData.error || `Lỗi HTTP! status: ${res.status}`);
            }
            setComments(prevComments => prevComments.filter(c => c._id !== id)); // Cập nhật state
            setError(null);
            alert('Xóa bình luận thành công!');
        } catch (err: any) {
            console.error("Lỗi xóa bình luận:", err);
            setError(`Lỗi khi xóa: ${err.message}`);
            alert(`Lỗi khi xóa: ${err.message}`);
        }
    };

    // === RENDER JSX ===
    return (
        <div className="p-6">
            {/* Header: Tiêu đề, Tìm kiếm, Nút thêm */}
            <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-800">Quản lý Bình luận</h1>
                <div className="flex items-center space-x-4">
                    {/* Ô tìm kiếm */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm tên bài, người dùng, nội dung..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            disabled={loading} // Disable khi đang loading
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out disabled:bg-gray-100"
                        />
                    </div>
                    {/* Nút thêm */}
                    {/* 
                    <button
                        onClick={() => { setShowAdd(true); setEditing(null); setNewContent(''); setError(null); }}
                        disabled={loading || !!editing || showAdd} // Disable khi loading hoặc đang sửa/thêm
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Thêm BL (Nhạc)
                    </button>
                    */}
                </div>
            </div>

            {/* Thông báo lỗi tổng */}
            {error && !loading && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded">{error}</div>}

            {/* Form Thêm (Hiện chỉ hỗ trợ Music) */}
            {showAdd && (
                <div className="mb-6 p-4 border rounded shadow-md bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-xl font-semibold">Bình luận Mới (cho Bài nhạc)</h2>
                        <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600" aria-label="Đóng form thêm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    {/* Nội dung form thêm... */}
                    <div className="mb-3">
                        <label htmlFor="musicSelect" className="block text-sm font-medium text-gray-700 mb-1">Bài nhạc:</label>
                        <select
                            id="musicSelect"
                            className="w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-gray-100"
                            value={newMusicId}
                            onChange={e => setNewMusicId(e.target.value)}
                            required
                            disabled={musicTracks.length === 0}
                        >
                            <option value="" disabled>-- {musicTracks.length > 0 ? 'Chọn bài nhạc' : 'Không có bài nhạc'} --</option>
                            {musicTracks.map(track => (
                                <option key={track._id} value={track._id}>
                                    {track.title}
                                </option>
                            ))}
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
                    <button className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50" onClick={handleAdd} disabled={!newMusicId}>
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
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-xl font-semibold">Sửa Bình luận</h2>
                        <button onClick={() => { setEditing(null); setNewContent(''); }} className="text-gray-400 hover:text-gray-600" aria-label="Đóng form sửa">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                        Nơi bình luận ({formatReferenceType(editing.referenceType)}): <span className="font-medium">{editing.referenceTitle}</span>
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
                <div className="text-center py-10 text-gray-500">Đang tải bình luận...</div>
            ) : !error ? ( // Chỉ hiển thị bảng nếu không loading và không có lỗi fetch ban đầu
                <div className="bg-white rounded-lg shadow overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nơi bình luận</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người dùng</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Nội dung</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {/* Sử dụng filteredComments */}
                            {filteredComments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                        {searchTerm ? 'Không tìm thấy bình luận nào phù hợp.' : 'Chưa có bình luận nào.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredComments.map(c => (
                                    <tr key={c._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{c.referenceTitle}</div>
                                            <div className="text-xs text-gray-500">{formatReferenceType(c.referenceType)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{c.userFullName}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 break-words">{c.content}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-700">{formatDateTime(c.createdAt)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                onClick={() => {
                                                    setEditing(c);
                                                    setNewContent(c.content);
                                                    setShowAdd(false);
                                                    setError(null);
                                                }}
                                                aria-label={`Sửa bình luận của ${c.userFullName}`}
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                className="text-red-600 hover:text-red-900"
                                                onClick={() => handleDelete(c._id)}
                                                aria-label={`Xóa bình luận của ${c.userFullName}`}
                                            >
                                                Xóa
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            ) : null /* Trường hợp có lỗi fetch ban đầu thì không hiển thị bảng */}
        </div>
    );
}