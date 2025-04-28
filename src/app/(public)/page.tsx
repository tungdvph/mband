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
    createdAt: string; // Thay đổi từ date thành createdAt
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
    image: string;
    audio: string;
  }>;
}

export default function Home() {
  const [data, setData] = useState<HomeData>({ news: [], events: [], featuredMusic: [] });
  const [loading, setLoading] = useState(true);

  // Thêm state cho slideshow
  const bannerImages = [
    "/upload/home/hero-bg.jpg",
    "/upload/home/hero-bg2.jpg",
    "/upload/home/hero-bg3.jpg"
  ];
  const [currentSlide, setCurrentSlide] = useState(0);

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

  // Tự động chuyển slide mỗi 4 giây
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [bannerImages.length]);

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-16">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Section - Slideshow */}
      <div className="relative h-[600px] overflow-hidden">
        <div className="absolute inset-0 bg-black/50">
          <img
            src={bannerImages[currentSlide]}
            alt="Band Hero"
            className="w-full h-full object-cover transition-all duration-700"
            style={{ objectFit: 'cover' }}
          />
        </div>
        {/* Nút chuyển slide */}
        <button
          className="absolute left-4 top-1/2 z-20 bg-black/40 text-white rounded-full p-2"
          onClick={() => setCurrentSlide((prev) => (prev - 1 + bannerImages.length) % bannerImages.length)}
        >
          &#8592;
        </button>
        <button
          className="absolute right-4 top-1/2 z-20 bg-black/40 text-white rounded-full p-2"
          onClick={() => setCurrentSlide((prev) => (prev + 1) % bannerImages.length)}
        >
          &#8594;
        </button>
        {/* Dots indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {bannerImages.map((_, idx) => (
            <span
              key={idx}
              className={`w-3 h-3 rounded-full ${idx === currentSlide ? 'bg-white' : 'bg-gray-400'} inline-block`}
            />
          ))}
        </div>
        <div className="relative z-10 h-full flex items-center justify-center text-white text-center">
          <div>
            <h1 className="text-6xl font-bold mb-4 animate-shine bg-gradient-to-r from-yellow-300 via-pink-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
              Band Name
            </h1>
            <p className="text-xl mb-8 animate-shine bg-gradient-to-r from-yellow-200 via-pink-300 to-blue-300 bg-clip-text text-transparent drop-shadow">
              Trải Nghiệm Âm Nhạc
            </p>
            <div className="flex justify-center gap-4">
              <a
                href="/booking"
                className="shine-btn px-8 py-3 rounded-full text-white font-semibold transition"
              >
                Đặt Lịch Ngay
              </a>
              <a
                href="/schedule"
                className="shine-btn px-8 py-3 rounded-full text-white font-semibold transition"
              >
                Đặt Vé Ngay
              </a>
            </div>
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
                _id={item._id}
                title={item.title}
                content={item.content}
                image={item.image || '/default-news.png'}
                date={new Date(item.createdAt)}
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
                image={track.image}
                audio={track.audio}
              />
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
