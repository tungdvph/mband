// src/app/(public)/music/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';        // Đảm bảo đường dẫn đúng
import MusicPlayer from '@/components/ui/MusicPlayer';  // Đảm bảo đường dẫn đúng
import { Music } from '@/types/music';                // Đảm bảo đường dẫn đúng
import { useRouter } from 'next/navigation';

export default function MusicPage() {
  const [music, setMusic] = useState<Music[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchMusic = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/music');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setMusic(data.filter((item: Music) => item.isPublished));
      } catch (error: any) {
        console.error('Error fetching music:', error);
        setError(error.message || 'Không thể tải danh sách nhạc.');
      } finally {
        setLoading(false);
      }
    };

    fetchMusic();
  }, []);

  // Không cần yêu cầu đăng nhập để xem chi tiết trang nhạc nữa,
  // nhưng nếu cần thì dùng logic tương tự trang schedule
  const handleViewDetails = (trackId: string) => {
    router.push(`/music/${trackId}`);
    // Logic kiểm tra đăng nhập có thể thêm ở đây nếu cần
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-10 text-center text-gray-800">
          Nghe Nhạc
        </h1>

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
            {music.length > 0 ? (
              music.map((track) => (
                // Card cho mỗi bài hát
                <div
                  key={track._id}
                  className="bg-white p-5 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 flex flex-col md:flex-row md:items-center gap-4 md:gap-6"
                >
                  {/* Phần Music Player */}
                  <div className="flex-grow w-full">
                    {/* Truyền props vào MusicPlayer đã được làm đẹp */}
                    <MusicPlayer
                      title={track.title}
                      artist={track.artist}
                      image={track.image}
                      audio={track.audio}
                      description={track.description}
                    />
                  </div>

                  {/* Phần nút "Xem chi tiết" */}
                  <div className="flex-shrink-0 mt-4 md:mt-0 w-full md:w-auto flex justify-center md:justify-end">
                    <button
                      className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150 ease-in-out whitespace-nowrap"
                      onClick={() => handleViewDetails(track._id)}
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              ))
            ) : (
              // Thông báo khi không có bài hát nào
              <div className="text-center text-gray-500 py-10 text-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                Không tìm thấy bài hát nào được phát hành.
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}