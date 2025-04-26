'use client';
import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import NewsCard from '@/components/ui/NewsCard';

interface News {
  _id: string;
  title: string;
  content: string;
  image: string;
  createdAt: string; // Thay đổi từ date thành createdAt
  author: string;
}

export default function NewsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('/api/news'); // Mặc định không cần param, chỉ lấy tin đã xuất bản
        if (response.ok) {
          const data = await response.json();
          setNews(data);
        }
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">Latest News</h1>
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {news.map((item) => (
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
        )}
      </div>
    </Layout>
  );
}