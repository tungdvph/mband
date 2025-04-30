'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';    // Đảm bảo đường dẫn đúng
import NewsCard from '@/components/ui/NewsCard';    // Đảm bảo đường dẫn đúng
import { useRouter } from 'next/navigation';      // Import nếu cần dùng router

// Interface cho một bản tin (giữ nguyên hoặc điều chỉnh nếu cần)
interface News {
  _id: string;
  title: string;
  content: string; // Hoặc có thể là excerpt/summary từ API
  image?: string;  // Ảnh là tùy chọn
  createdAt: string; // Giữ là string ISO date
  author?: string; // Tác giả là tùy chọn
}

export default function NewsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Thêm state lỗi
  // const router = useRouter(); // Khởi tạo nếu cần dùng

  const defaultImage = '/images/default-news.png'; // Ảnh mặc định

  useEffect(() => {
    setLoading(true);
    setError(null); // Reset lỗi
    const fetchNews = async () => {
      try {
        const response = await fetch('/api/news'); // API lấy danh sách tin tức
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Không thể tải tin tức (Lỗi ${response.status})`);
        }
        const data = await response.json();
        // API có thể trả về { news: [...] } hoặc chỉ [...]
        const newsData = data.news || data;
        if (Array.isArray(newsData)) {
          // Sắp xếp tin mới nhất lên đầu (thường backend làm việc này)
          const sortedNews = newsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setNews(sortedNews);
        } else {
          console.error("Invalid news list data structure received:", data);
          throw new Error("Dữ liệu tin tức trả về không hợp lệ.");
        }

      } catch (error: any) {
        console.error('Error fetching news:', error);
        setError(error.message || 'Đã xảy ra lỗi khi tải danh sách tin tức.');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []); // Fetch một lần khi component mount

  return (
    <Layout>
      {/* Container chính với nền và padding */}
      <div className="bg-gray-50 min-h-screen py-12 md:py-16">
        <div className="container mx-auto px-4">
          {/* Tiêu đề trang */}
          <div className="text-center mb-12 md:mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 tracking-tight">
              Tin Tức
            </h1>
            <p className="mt-3 text-lg text-gray-500 max-w-2xl mx-auto">
              Cập nhật những thông tin, hoạt động và chia sẻ mới nhất từ chúng tôi.
            </p>
          </div>

          {/* Trạng thái Loading */}
          {loading && (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-3"></div>
              <p className="text-gray-600">Đang tải tin tức...</p>
            </div>
          )}

          {/* Trạng thái Lỗi */}
          {error && !loading && (
            <div className="text-center py-10 bg-red-50 border border-red-200 rounded-lg max-w-lg mx-auto p-6 shadow">
              <h3 className="text-xl font-semibold text-red-700 mb-2">Không thể tải dữ liệu</h3>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Hiển thị lưới tin tức hoặc thông báo không có tin */}
          {!loading && !error && (
            <>
              {news.length > 0 ? (
                // Grid layout cho các thẻ tin tức
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {news.map((item) => (
                    <NewsCard
                      key={item._id}
                      _id={item._id} // ID để tạo link chi tiết trong NewsCard
                      title={item.title}
                      // Truyền content, NewsCard sẽ tự cắt ngắn nếu cần
                      content={item.content}
                      image={item.image || defaultImage} // Ảnh hoặc ảnh mặc định
                      createdAt={item.createdAt} // Truyền date string
                      author={item.author}
                    />
                  ))}
                </div>
              ) : (
                // Thông báo khi không có tin tức
                <div className="text-center text-gray-500 py-16">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  <p className="text-lg">Hiện chưa có tin tức nào được đăng.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}