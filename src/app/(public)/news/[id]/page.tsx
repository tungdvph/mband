'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import NewsContent from '@/components/ui/NewsContent';

interface NewsDetail {
  _id: string;
  title: string;
  content: string;
  image: string;
  createdAt: string;
  author: string;
}

export default function NewsDetailPage() {
  const params = useParams();
  const [news, setNews] = useState<NewsDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNewsDetail = async () => {
      try {
        const response = await fetch(`/api/news/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setNews(data);
        }
      } catch (error) {
        console.error('Error fetching news detail:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchNewsDetail();
    }
  }, [params.id]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">Đang tải...</div>
        </div>
      </Layout>
    );
  }

  if (!news) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">Không tìm thấy bài viết</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <img 
            src={news.image || '/default-news.png'} 
            alt={news.title} 
            className="w-full h-96 object-cover rounded-lg mb-8" 
          />
          <h1 className="text-4xl font-bold mb-4">{news.title}</h1>
          <div className="mb-8 text-gray-500">
            <span>{new Date(news.createdAt).toLocaleDateString('vi-VN')}</span>
            <span className="mx-2">•</span>
            <span>{news.author}</span>
          </div>
          <NewsContent content={news.content} />
        </div>
      </div>
    </Layout>
  );
}