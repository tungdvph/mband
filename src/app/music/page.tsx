'use client';
import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import MusicPlayer from '@/components/ui/MusicPlayer';

interface Music {
  _id: string;
  title: string;
  artist: string;
  image: string;          // Thay đổi từ coverImage
  audio: string;          // Thay đổi từ audioUrl
  description: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function MusicPage() {
  const [music, setMusic] = useState<Music[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMusic = async () => {
      try {
        const response = await fetch('/api/music');
        if (response.ok) {
          const data = await response.json();
          // Chỉ hiển thị nhạc đã publish
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">Our Music</h1>
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <div className="space-y-6">
            {music.map((track) => (
              <MusicPlayer
                key={track._id}
                title={track.title}
                artist={track.artist}
                coverImage={track.image}    // Map từ image sang coverImage
                audioUrl={track.audio}      // Map từ audio sang audioUrl
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}