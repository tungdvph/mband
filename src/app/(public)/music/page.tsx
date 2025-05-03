// src/app/(public)/music/page.tsx
'use client';

import { useEffect, useState, useMemo, ChangeEvent } from 'react';
import Layout from '@/components/layout/Layout';      // Đảm bảo đường dẫn đúng
import MusicPlayer from '@/components/ui/MusicPlayer'; // Đảm bảo đường dẫn đúng
import { Music } from '@/types/music';                // Đường dẫn đến type Music bạn đã cung cấp
import { useRouter } from 'next/navigation';

// Chỉ còn lại các tùy chọn sắp xếp theo ngày vì không có trường 'price'
type SortOption = 'date_desc' | 'date_asc';

export default function MusicPage() {
  const [music, setMusic] = useState<Music[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  // Mặc định sắp xếp mới nhất
  const [sortOption, setSortOption] = useState<SortOption>('date_desc');
  const router = useRouter();

  useEffect(() => {
    const fetchMusic = async () => {
      setLoading(true);
      setError(null);
      try {
        // API này cần trả về dữ liệu khớp với type Music (bao gồm createdAt)
        const response = await fetch('/api/music');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data: Music[] = await response.json(); // Ép kiểu dữ liệu nhận về là Music[]

        // Lọc những bài hát đã publish
        const publishedMusic = data.filter(item => item.isPublished);
        setMusic(publishedMusic);

      } catch (error: any) {
        console.error('Error fetching music:', error);
        setError(error.message || 'Không thể tải danh sách nhạc.');
      } finally {
        setLoading(false);
      }
    };

    fetchMusic();
  }, []);

  // Sử dụng useMemo để tối ưu việc lọc và sắp xếp
  const displayedMusic = useMemo(() => {
    let filtered = music;

    // 1. Lọc theo searchTerm (tìm kiếm theo tên bài hát - title)
    if (searchTerm) {
      filtered = filtered.filter(track =>
        track.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 2. Sắp xếp theo sortOption
    // Tạo bản sao trước khi sort
    const sorted = [...filtered];
    switch (sortOption) {
      case 'date_desc': // Mới nhất -> Cũ nhất
        // Đảm bảo createdAt là Date object hoặc có thể chuyển đổi thành Date
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'date_asc': // Cũ nhất -> Mới nhất
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      default:
        // Mặc định cũng là mới nhất
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return sorted;
  }, [music, searchTerm, sortOption]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSortChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSortOption(event.target.value as SortOption);
  };

  const handleViewDetails = (trackId: string) => {
    router.push(`/music/${trackId}`);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-10 text-center text-gray-800">
          Nghe Nhạc
        </h1>

        {/* === Phần Tìm kiếm và Sắp xếp === */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          {/* Input tìm kiếm */}
          <div className="w-full sm:w-1/2">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên bài hát..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Select sắp xếp */}
          <div className="w-full sm:w-auto">
            <label htmlFor="sort-select" className="sr-only">Sắp xếp theo</label> {/* Thêm label ẩn cho accessibility */}
            <select
              id="sort-select"
              value={sortOption}
              onChange={handleSortChange}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="date_desc">Mới nhất</option>
              <option value="date_asc">Cũ nhất</option>
              {/* Đã loại bỏ các option sắp xếp theo giá */}
            </select>
          </div>
        </div>
        {/* === Kết thúc Phần Tìm kiếm và Sắp xếp === */}


        {/* Trạng thái Loading */}
        {loading && (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Đang tải danh sách nhạc...</p>
          </div>
        )}

        {/* Trạng thái Lỗi */}
        {error && !loading && (
          <div className="text-center py-10 bg-red-50 border border-red-200 rounded-lg max-w-lg mx-auto p-6 shadow">
            <h3 className="text-xl font-semibold text-red-700 mb-2">Đã xảy ra lỗi</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Hiển thị danh sách nhạc hoặc thông báo không có nhạc */}
        {!loading && !error && (
          <div className="space-y-6">
            {displayedMusic.length > 0 ? (
              displayedMusic.map((track) => (
                // Card cho mỗi bài hát
                <div
                  key={track._id} // Sử dụng _id làm key
                  className="bg-white p-5 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 flex flex-col md:flex-row md:items-center gap-4 md:gap-6"
                >
                  {/* Phần Music Player */}
                  <div className="flex-grow w-full">
                    <MusicPlayer
                      title={track.title}
                      artist={track.artist}
                      image={track.image}
                      audio={track.audio}
                      description={track.description}
                    // Các props khác nếu MusicPlayer cần
                    />
                  </div>

                  {/* Phần nút "Xem chi tiết" */}
                  <div className="flex-shrink-0 mt-4 md:mt-0 w-full md:w-auto flex justify-center md:justify-end">
                    <button
                      className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150 ease-in-out whitespace-nowrap"
                      onClick={() => handleViewDetails(track._id)} // Sử dụng _id
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              ))
            ) : (
              // Thông báo khi không có bài hát nào (sau khi lọc hoặc fetch)
              <div className="text-center text-gray-500 py-10 text-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                {searchTerm
                  ? `Không tìm thấy bài hát nào phù hợp với "${searchTerm}".`
                  : 'Không tìm thấy bài hát nào được phát hành.'
                }
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}