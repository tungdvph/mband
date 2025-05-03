// src/app/(public)/news/page.tsx
'use client';

import { useEffect, useState, useMemo, ChangeEvent } from 'react';
import Layout from '@/components/layout/Layout';
import NewsCard from '@/components/ui/NewsCard';
// *** Đảm bảo đường dẫn này đúng và file /types/news.ts đã được cập nhật ***
import { News } from '@/types/news';
// import { useRouter } from 'next/navigation'; // Bỏ comment nếu cần router

// Type cho các tùy chọn sắp xếp
type SortOption = 'date_desc' | 'date_asc';

export default function NewsPage() {
  // *** State `news` giờ đây mong đợi News[] với createdAt là string ***
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('date_desc');
  // const router = useRouter();

  const defaultImage = '/images/default-news.png'; // Ảnh mặc định

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/news');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Không thể tải tin tức (Lỗi ${response.status})`);
        }
        // Dữ liệu nhận về từ JSON.parse sẽ có createdAt là string
        const data = await response.json();
        const newsData: News[] = Array.isArray(data) ? data : (data.news || []);

        if (!Array.isArray(newsData)) {
          console.error("Invalid news list data structure received:", data);
          throw new Error("Dữ liệu tin tức trả về không hợp lệ.");
        }
        // Dữ liệu gán vào state đã có createdAt là string
        setNews(newsData);

      } catch (error: any) {
        console.error('Error fetching news:', error);
        setError(error.message || 'Đã xảy ra lỗi khi tải danh sách tin tức.');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  // Lọc và sắp xếp danh sách hiển thị
  const displayedNews = useMemo(() => {
    let filtered = news;

    // 1. Lọc theo searchTerm (tìm kiếm theo tiêu đề - title)
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 2. Sắp xếp theo sortOption
    const sorted = [...filtered];
    // Mặc dù createdAt là string, new Date(string) vẫn hoạt động để so sánh
    switch (sortOption) {
      case 'date_desc': // Mới nhất -> Cũ nhất
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'date_asc': // Cũ nhất -> Mới nhất
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      default:
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }
    return sorted;
  }, [news, searchTerm, sortOption]);

  // Handler cho input tìm kiếm
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Handler cho select sắp xếp
  const handleSortChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSortOption(event.target.value as SortOption);
  };

  return (
    <Layout>
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

          {/* === Phần Tìm kiếm và Sắp xếp === */}
          <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="w-full sm:w-1/2">
              <input
                type="text"
                placeholder="Tìm kiếm theo tiêu đề bài viết..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="w-full sm:w-auto">
              <label htmlFor="sort-select-news" className="sr-only">Sắp xếp theo</label>
              <select
                id="sort-select-news"
                value={sortOption}
                onChange={handleSortChange}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="date_desc">Mới nhất</option>
                <option value="date_asc">Cũ nhất</option>
              </select>
            </div>
          </div>
          {/* === Kết thúc Phần Tìm kiếm và Sắp xếp === */}

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
              {displayedNews.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {displayedNews.map((item) => (
                    <NewsCard
                      key={item._id}
                      _id={item._id}
                      title={item.title}
                      content={item.content}
                      image={item.image || defaultImage}
                      // *** Truyền thẳng chuỗi createdAt ***
                      createdAt={item.createdAt}
                      author={item.author}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-16">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  <p className="text-lg">
                    {searchTerm
                      ? `Không tìm thấy bài viết nào phù hợp với "${searchTerm}".`
                      : 'Hiện chưa có tin tức nào được đăng.'
                    }
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}