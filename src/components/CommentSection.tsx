'use client';
import { useEffect, useState } from 'react';

interface Comment {
  _id: string;
  userFullName: string;
  content: string;
  createdAt: string;
}

interface CommentSectionProps {
  musicId: string;
}

export default function CommentSection({ musicId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState('');
  const [userFullName, setUserFullName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lấy thông tin user (giả sử đã đăng nhập, lấy từ localStorage)
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserFullName(user.fullName || '');

    // Lấy bình luận
    setLoading(true);
    fetch(`/api/music/${musicId}/comments`)
      .then(res => res.json())
      .then(data => setComments(data))
      .finally(() => setLoading(false));
  }, [musicId]);

  const handleComment = async () => {
    if (!comment.trim()) return;
    const res = await fetch(`/api/music/${musicId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: comment }),
    });
    if (res.ok) {
      const newComment = await res.json();
      setComments([newComment, ...comments]);
      setComment('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mt-6">
      <h3 className="text-lg font-semibold mb-2">Bình luận</h3>
      <div className="mb-4">
        <input
          type="text"
          className="border rounded px-3 py-2 w-full"
          placeholder="Nhập bình luận..."
          value={comment}
          onChange={e => setComment(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
          onClick={handleComment}
          disabled={!userFullName}
        >
          Gửi bình luận
        </button>
        {!userFullName && (
          <div className="text-red-500 mt-1">Bạn cần đăng nhập để bình luận.</div>
        )}
      </div>
      {loading ? (
        <div>Đang tải bình luận...</div>
      ) : (
        <div className="space-y-3">
          {comments.map(c => (
            <div key={c._id} className="bg-gray-100 p-3 rounded">
              <div className="font-semibold">{c.userFullName}</div>
              <div>{c.content}</div>
              <div className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}