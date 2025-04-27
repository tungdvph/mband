// components/CommentSection.js
'use client';

import { useSession } from 'next-auth/react'; // Bước 1: Import useSession
import { useEffect, useState } from 'react';

// Interface định nghĩa cấu trúc dữ liệu của một bình luận
interface Comment {
    _id: string;
    userFullName: string; // Tên đầy đủ của người bình luận
    content: string;      // Nội dung bình luận
    createdAt: string;    // Thời gian tạo (dạng string ISO)
}

// Interface định nghĩa các props cho component CommentSection
interface CommentSectionProps {
    type: 'music' | 'news'; // Loại nội dung (để xác định API endpoint)
    id: string;             // ID của bài nhạc hoặc tin tức
}

export default function CommentSection({ type, id }: CommentSectionProps) {
    // Bước 2: Lấy thông tin session và trạng thái xác thực từ NextAuth.js
    const { data: session, status } = useSession();
    // status có thể là: 'loading', 'authenticated', 'unauthenticated'

    // State quản lý danh sách bình luận
    const [comments, setComments] = useState<Comment[]>([]);
    // State quản lý nội dung đang nhập của bình luận mới
    const [comment, setComment] = useState('');
    // State quản lý trạng thái tải danh sách bình luận
    const [loadingComments, setLoadingComments] = useState(true);
    // State quản lý trạng thái đang gửi bình luận mới
    const [submitting, setSubmitting] = useState(false);
    // State quản lý thông báo lỗi khi gửi bình luận
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Bước 3: Xác định thông tin người dùng và trạng thái đăng nhập từ session
    const userFullName = session?.user?.fullName; // Lấy tên từ session nếu đã đăng nhập
    // Kiểm tra xem người dùng đã đăng nhập thành công VÀ có thông tin người dùng hay không
    const isLoggedIn = status === 'authenticated' && !!userFullName;

    // useEffect để tải danh sách bình luận khi component được mount hoặc type/id thay đổi
    useEffect(() => {
        setLoadingComments(true); // Bắt đầu tải
        fetch(`/api/${type}/${id}/comments`) // Gọi API GET để lấy bình luận
            .then(res => {
                if (!res.ok) { // Kiểm tra nếu request không thành công
                    console.error(`Lỗi ${res.status} khi tải bình luận.`);
                    throw new Error('Không thể tải bình luận');
                }
                return res.json();
            })
            .then(data => {
                // Đảm bảo dữ liệu trả về là một mảng trước khi set state
                setComments(Array.isArray(data) ? data : []);
            })
            .catch(error => {
                console.error('Lỗi khi fetch bình luận:', error);
                setComments([]); // Đặt thành mảng rỗng nếu có lỗi
            })
            .finally(() => {
                setLoadingComments(false); // Kết thúc tải (dù thành công hay lỗi)
            });
    }, [type, id]); // Dependencies: chạy lại khi type hoặc id thay đổi

    // Hàm xử lý việc gửi bình luận mới
    const handleComment = async () => {
        // Kiểm tra điều kiện trước khi gửi: đã đăng nhập, có nội dung, không đang gửi dở
        if (!isLoggedIn || !comment.trim() || submitting) return;

        setSubmitting(true);  // Đánh dấu đang gửi
        setSubmitError(null); // Xóa lỗi cũ (nếu có)

        try {
            // Gọi API POST để tạo bình luận mới
            const res = await fetch(`/api/${type}/${id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: comment }), // Gửi nội dung bình luận
            });

            if (res.ok) { // Nếu API trả về thành công (status 2xx)
                const newComment = await res.json();
                // Cập nhật UI ngay lập tức: Thêm bình luận mới vào đầu danh sách
                // Lấy userFullName từ session để đảm bảo hiển thị đúng tên
                const displayComment = {
                    ...newComment,
                    userFullName: userFullName || 'Người dùng' // Dùng tên từ session
                };
                setComments([displayComment, ...comments]);
                setComment(''); // Xóa nội dung đã nhập trong input
            } else { // Nếu API trả về lỗi (status 4xx, 5xx)
                const errorData = await res.json(); // Đọc nội dung lỗi từ API
                console.error('Lỗi API khi gửi bình luận:', errorData);
                // Hiển thị thông báo lỗi cho người dùng
                setSubmitError(errorData.error || `Lỗi ${res.status}: Không thể gửi bình luận.`);
                // Xử lý riêng cho lỗi 401 (Chưa đăng nhập/Session hết hạn)
                if (res.status === 401) {
                    console.warn("Yêu cầu đăng nhập lại.");
                    // Có thể thêm logic chuyển hướng đến trang đăng nhập tại đây nếu muốn
                    // Ví dụ: router.push('/login'); (cần import useRouter từ next/navigation)
                }
            }
        } catch (error) { // Xử lý lỗi mạng hoặc lỗi không xác định khác
            console.error("Lỗi mạng hoặc lỗi khác khi gửi bình luận:", error);
            setSubmitError("Đã xảy ra lỗi mạng hoặc lỗi không xác định. Vui lòng thử lại.");
        } finally {
            setSubmitting(false); // Kết thúc trạng thái đang gửi (dù thành công hay lỗi)
        }
    };

    // Xác định xem nút gửi có nên bị vô hiệu hóa không
    const isSubmitDisabled = !isLoggedIn || !comment.trim() || submitting;

    return (
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mt-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Bình luận</h3>

            {/* Phần nhập bình luận */}
            <div className="mb-6">
                {/* Chỉ hiển thị ô nhập nếu ĐÃ ĐĂNG NHẬP */}
                {status === 'authenticated' && isLoggedIn && (
                    <>
                        <textarea
                            className="border border-gray-300 rounded px-3 py-2 w-full mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
                            rows={3}
                            placeholder={`Viết bình luận với tư cách ${userFullName}...`}
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            disabled={submitting} // Vô hiệu hóa khi đang gửi
                            aria-label="Nhập bình luận"
                        />
                        <button
                            className={`bg-blue-600 text-white px-5 py-2 rounded font-medium text-sm transition duration-150 ease-in-out ${isSubmitDisabled
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:bg-blue-700'
                                }`}
                            onClick={handleComment}
                            disabled={isSubmitDisabled} // Vô hiệu hóa dựa trên điều kiện
                        >
                            {submitting ? 'Đang gửi...' : 'Gửi bình luận'}
                        </button>
                    </>
                )}

                {/* Hiển thị thông báo nếu đang kiểm tra đăng nhập */}
                {status === 'loading' && (
                    <div className="text-gray-500 text-sm p-3 border border-gray-200 bg-gray-50 rounded">
                        Đang kiểm tra trạng thái đăng nhập...
                    </div>
                )}

                {/* Hiển thị thông báo yêu cầu đăng nhập nếu CHƯA ĐĂNG NHẬP */}
                {status === 'unauthenticated' && (
                    <div className="text-red-600 text-sm p-3 border border-red-200 bg-red-50 rounded">
                        Vui lòng{' '}
                        <a href="/login" className="font-bold underline hover:text-red-700">
                            đăng nhập
                        </a>{' '}
                        để gửi bình luận.
                    </div>
                )}

                {/* Hiển thị lỗi nếu có lỗi khi gửi bình luận */}
                {submitError && (
                    <div className="text-red-600 mt-2 text-sm font-medium">{submitError}</div>
                )}
            </div>

            {/* Phần hiển thị danh sách bình luận */}
            {loadingComments ? (
                <div className="text-center text-gray-500 py-4">Đang tải bình luận...</div>
            ) : (
                <div className="space-y-4">
                    {comments.length > 0 ? (
                        comments.map(c => (
                            <div key={c._id} className="bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-100">
                                <div className="flex items-center mb-1">
                                    {/* Có thể thêm Avatar người dùng ở đây */}
                                    <span className="font-semibold text-sm text-gray-800">{c.userFullName || 'Người dùng ẩn danh'}</span>
                                </div>
                                <p className="text-gray-700 text-sm mb-1 break-words">{c.content}</p>
                                <div className="text-xs text-gray-500">
                                    {/* Định dạng lại ngày giờ cho dễ đọc */}
                                    {new Date(c.createdAt).toLocaleString('vi-VN', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: false // Sử dụng định dạng 24h
                                    })}
                                </div>
                            </div>
                        ))
                    ) : (
                        // Hiển thị thông báo nếu không có bình luận nào
                        <div className="text-center text-gray-500 text-sm py-4">Chưa có bình luận nào.</div>
                    )}
                </div>
            )}
        </div>
    );
}