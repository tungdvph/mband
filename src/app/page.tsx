'use client';
import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import MusicPlayer from '@/components/ui/MusicPlayer';
import NewsCard from '@/components/ui/NewsCard';
import EventCard from '@/components/ui/EventCard';

interface HomeData {
  news: Array<{
    _id: string;
    title: string;
    content: string;
    image: string;
    date: Date;
    author: string;
  }>;
  events: Array<{
    _id: string;
    title: string;
    date: Date;
    location: string;
    image: string;
    price: number;
    availableTickets: number;
  }>;
  featuredMusic: Array<{
    _id: string;
    title: string;
    artist: string;
    coverImage: string;
    audioUrl: string;
  }>;
}

export default function Home() {
  const [data, setData] = useState<HomeData>({ news: [], events: [], featuredMusic: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [newsRes, eventsRes, musicRes] = await Promise.all([
          fetch('/api/news?limit=3'),
          fetch('/api/schedule?limit=3'),
          fetch('/api/music?featured=true')
        ]);

        const [news, events, featuredMusic] = await Promise.all([
          newsRes.json(),
          eventsRes.json(),
          musicRes.json()
        ]);

        setData({ news, events, featuredMusic });
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-16">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Section */}
      <div className="relative h-[600px]">
        <div className="absolute inset-0 bg-black/50">
          <img
            src="/images/hero-bg.jpg"
            alt="Band Hero"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 h-full flex items-center justify-center text-white text-center">
          <div>
            <h1 className="text-6xl font-bold mb-4">Band Name</h1>
            <p className="text-xl mb-8">Experience the Music</p>
            <button className="bg-red-600 text-white px-8 py-3 rounded-full hover:bg-red-700">
              Book Now
            </button>
          </div>
        </div>
      </div>

      {/* Latest News Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">Latest News</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {data.news.map((item) => (
              <NewsCard
                key={item._id}
                title={item.title}
                content={item.content}
                image={item.image}
                date={new Date(item.date)}
                author={item.author}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">Upcoming Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {data.events.map((event) => (
              <EventCard
                key={event._id}
                title={event.title}
                date={new Date(event.date)}
                location={event.location}
                image={event.image}
                price={event.price}
                availableTickets={event.availableTickets}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Music Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">Featured Music</h2>
          <div className="space-y-4">
            {data.featuredMusic.map((track) => (
              <MusicPlayer
                key={track._id}
                title={track.title}
                artist={track.artist}
                image={track.coverImage}      // Đổi từ coverImage sang image
                audio={track.audioUrl}        // Đổi từ audioUrl sang audio
              />
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
