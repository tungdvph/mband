'use client';
import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import MusicPlayer from '@/components/ui/MusicPlayer';
import { Music } from '@/types/music';
import { useRouter } from 'next/navigation';

export default function MusicPage() {
  const [music, setMusic] = useState<Music[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMusic = async () => {
      try {
        const response = await fetch('/api/music');
        if (response.ok) {
          const data = await response.json();
          setMusic(data.filter((item: Music) => item.isPublished));
        }
      } catch (error) {
        console.error('Error fetching music:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMusic();
  }, []);

  const router = useRouter();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8 text-center md:text-left">Our Music</h1>
        {loading ? (
          <div className="text-center text-xl">Loading music...</div>
        ) : (
          <div className="space-y-8">
            {music.length > 0 ? (
              music.map((track) => (
                <div
                  key={track._id}
                  className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div className="flex-grow w-full">
                    <MusicPlayer
                      title={track.title}
                      artist={track.artist}
                      image={track.image}
                      audio={track.audio}
                      description={track.description}
                    />
                  </div>

                  {/* --- THAY ĐỔI Ở ĐÂY --- */}
                  {/* Container của button: Thêm 'flex justify-center' để căn giữa button khi ở chế độ flex-col (mobile) */}
                  <div className="flex-shrink-0 mt-4 md:mt-0 md:ml-4 flex justify-center">
                    <button
                      className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium shadow-md
                                 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5
                                 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white
                                 transition-all duration-200 ease-in-out" // Bỏ w-full, md:w-auto, dùng transition-all
                      onClick={() => router.push(`/music/${track._id}`)}
                    >
                      Xem chi tiết
                    </button>
                  </div>
                  {/* --- KẾT THÚC THAY ĐỔI --- */}
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500">No music found.</div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}