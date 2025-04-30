'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/components/layout/Layout';          // Đảm bảo đường dẫn đúng
import NewsContent from '@/components/ui/NewsContent';    // Đảm bảo đường dẫn đúng
import CommentSection from '@/components/CommentSection'; // Đảm bảo đường dẫn và props đúng
// Icons
import { FaCalendarAlt, FaUserEdit } from 'react-icons/fa';

// Interface cho chi tiết tin tức
interface NewsDetail {
  _id: string;
  title: string;
  content: string; // Nội dung có thể là HTML hoặc Markdown
  image?: string;   // Ảnh là tùy chọn
  createdAt: string; // ISO date string
  author?: string;  // Tác giả là tùy chọn
}

export default function NewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const newsId = params?.id as string | undefined; // Lấy ID từ params

  const [news, setNews] = useState<NewsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // State cho lỗi fetch

  const defaultImage = '/images/default-news.png'; // Đường dẫn ảnh mặc định

  useEffect(() => {
    if (newsId) {
      setLoading(true);
      setError(null);
      setNews(null); // Reset state trước khi fetch

      const fetchNewsDetail = async () => {
        try {
          const response = await fetch(`/api/news/${newsId}`); // Endpoint API chi tiết tin tức
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Không thể tải bài viết (Lỗi ${response.status})`);
          }
          const data = await response.json();
          // API có thể trả về { news: ... } hoặc chỉ { ... }
          const newsData = data.news || data;
          if (newsData && newsData._id) {
            setNews(newsData);
          } else {
            console.error("Invalid news data structure received:", data);
            throw new Error("Dữ liệu bài viết không hợp lệ.");
          }

        } catch (error: any) {
          console.error('Error fetching news detail:', error);
          setError(error.message || 'Đã xảy ra lỗi khi tải chi tiết bài viết.');
        } finally {
          setLoading(false);
        }
      };
      fetchNewsDetail();
    } else {
      // Xử lý trường hợp không có ID (ít khi xảy ra với routing đúng)
      setError("ID bài viết không hợp lệ.");
      setLoading(false);
    }
  }, [newsId]); // Fetch lại khi newsId thay đổi

  // --- Render Trạng Thái Loading ---
  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Đang tải bài viết...</p>
        </div>
      </Layout>
    );
  }

  // --- Render Trạng Thái Lỗi ---
  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          {/* Nút quay lại */}
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-indigo-600 mb-6 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /> </svg>
            Quay lại
          </button>
          {/* Thông báo lỗi */}
          <div className="text-center py-10 bg-red-50 border border-red-200 rounded-lg max-w-lg mx-auto p-6 shadow">
            <h3 className="text-xl font-semibold text-red-700 mb-2">Không thể tải trang</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  // --- Render Trạng Thái Không Tìm Thấy Bài Viết ---
  if (!news) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-indigo-600 mb-6 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /> </svg>
            Quay lại
          </button>
          <div className="text-center py-10 text-gray-500">Không tìm thấy bài viết này.</div>
        </div>
      </Layout>
    );
  }

  // --- Render Nội dung chi tiết bài viết ---
  const imageUrl = news.image || defaultImage; // Lấy ảnh bài viết hoặc ảnh mặc định
  const formattedDate = new Date(news.createdAt).toLocaleDateString('vi-VN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <Layout>
      {/* Container chính với nền nhẹ */}
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="container mx-auto px-4">
          {/* Nút quay lại */}
          <div className="mb-6 max-w-4xl mx-auto"> {/* Đặt nút quay lại cùng dòng với content */}
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-indigo-700 font-medium transition-colors duration-150"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /> </svg>
              Quay lại danh sách tin tức
            </button>
          </div>

          {/* Card chứa nội dung bài viết */}
          <article className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Ảnh bìa bài viết */}
            <img
              src={imageUrl}
              alt={news.title}
              className="w-full h-60 sm:h-80 md:h-[450px] object-cover" // Chiều cao ảnh có thể điều chỉnh
              onError={(e) => { (e.target as HTMLImageElement).src = defaultImage; }}
            />
            {/* Phần nội dung text trong card */}
            <div className="p-6 md:p-10">
              {/* Tiêu đề */}
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {news.title}
              </h1>

              {/* Thông tin meta (Ngày đăng, Tác giả) */}
              <div className="flex flex-wrap items-center space-x-4 text-sm text-gray-500 mb-8">
                <div className="flex items-center">
                  <FaCalendarAlt className="mr-1.5 text-gray-400" />
                  <span>{formattedDate}</span>
                </div>
                {news.author && (
                  <div className="flex items-center">
                    <FaUserEdit className="mr-1.5 text-gray-400" />
                    <span>{news.author}</span>
                  </div>
                )}
                {/* Có thể thêm số lượt xem, danh mục... nếu có */}
              </div>

              {/* Nội dung bài viết (sử dụng NewsContent và Tailwind Typography) */}
              <div className="prose prose-indigo sm:prose-lg max-w-none text-gray-800 prose-img:rounded-lg prose-a:text-indigo-600 hover:prose-a:text-indigo-800">
                {/* NewsContent sẽ render nội dung HTML/Markdown */}
                <NewsContent content={news.content} />
              </div>
            </div>
          </article>

          {/* Khu vực bình luận (nằm dưới card bài viết) */}
          <div className="max-w-4xl mx-auto mt-12">
            {/* Giả sử CommentSection đã được style đẹp từ trước */}
            {/* Cần truyền đúng props type="news" và id={news._id} */}
            <CommentSection type="news" id={news._id} />
          </div>

        </div>
      </div>
    </Layout>
  );
}