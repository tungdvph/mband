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
        <h1 className="text-4xl font-bold mb-8">Our Music</h1>
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <div className="space-y-6">
            {music.map((track) => (
              <div key={track._id} className="space-y-2">
                <MusicPlayer
                  title={track.title}
                  artist={track.artist}
                  image={track.image}
                  audio={track.audio}
                  description={track.description}
                />
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                  onClick={() => router.push(`/music/${track._id}`)}
                >
                  Xem chi tiết
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}