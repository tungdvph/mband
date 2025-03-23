'use client';
import { useState, useEffect } from 'react';
import { News } from '@/types/news';
import NewsForm from '@/components/admin/NewsForm';
import NewsContent from '@/components/ui/NewsContent';

export default function NewsManagement() {
  const [news, setNews] = useState<News[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentNews, setCurrentNews] = useState<News | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await fetch('/api/news?admin=true'); // Thêm param admin=true
      if (response.ok) {
        const data = await response.json();
        setNews(data);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  };

  const handleAddNews = () => {
    setCurrentNews(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData: FormData) => {
    try {
      const url = currentNews 
        ? `/api/news/${currentNews._id}`
        : '/api/news';
      
      const response = await fetch(url, {
        method: currentNews ? 'PUT' : 'POST',
        body: formData, // Giữ nguyên việc gửi FormData
      });
      
      if (!response.ok) {
        throw new Error('Lỗi khi lưu tin tức');
      }
      
      await fetchNews();
      setIsModalOpen(false);
      alert(currentNews ? 'Cập nhật thành công!' : 'Thêm tin tức thành công!');
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    }
  };

  const handleEditNews = (newsItem: News) => {
    setCurrentNews(newsItem);
    setIsModalOpen(true);
  };

  const handleDeleteNews = async (newsId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tin tức này?')) {
      try {
        const response = await fetch(`/api/news/${newsId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setNews(news.filter(item => item._id !== newsId));
        }
      } catch (error) {
        console.error('Error deleting news:', error);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý Tin tức</h1>
        <button
          onClick={handleAddNews}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Thêm tin tức
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.map((item) => (
          <div key={item._id} className="bg-white rounded-lg shadow overflow-hidden">
            <img 
              src={item.image} 
              alt={item.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <div className="text-gray-600 text-sm mb-4 line-clamp-3">
                <div dangerouslySetInnerHTML={{ 
                  __html: item.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...'
                }} />
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{item.author}</span>
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  item.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {item.isPublished ? 'Đã xuất bản' : 'Chưa xuất bản'}
                </span>
                <div>
                  <button
                    onClick={() => handleEditNews(item)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDeleteNews(item._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-white z-50">
          <div className="h-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {currentNews ? 'Sửa tin tức' : 'Thêm tin tức mới'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="max-w-4xl mx-auto">
              <NewsForm
                news={currentNews || undefined}
                onSubmit={handleSubmit}
                onCancel={() => setIsModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}