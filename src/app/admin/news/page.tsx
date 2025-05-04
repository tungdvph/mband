'use client';
import { useState, useEffect, useMemo } from 'react'; // <<< THÊM useMemo
import { News } from '@/types/news';
import NewsForm from '@/components/admin/NewsForm';
// NewsContent không được sử dụng trực tiếp ở đây, có thể xóa nếu không cần
// import NewsContent from '@/components/ui/NewsContent';

// <<< THÊM: Hàm helper định dạng trạng thái tin tức thành text >>>
const formatNewsStatusText = (isPublished: boolean): string => {
  return isPublished ? 'Đã xuất bản' : 'Chưa xuất bản';
};

export default function NewsManagement() {
  const [news, setNews] = useState<News[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentNews, setCurrentNews] = useState<News | null>(null);
  const [searchTerm, setSearchTerm] = useState(''); // <<< THÊM: State tìm kiếm

  // --- Fetch Data ---
  const fetchNews = async () => {
    try {
      const response = await fetch('/api/news?admin=true');
      if (response.ok) {
        const data = await response.json();
        setNews(data);
      } else {
        console.error('Failed to fetch news:', response.statusText);
        setNews([]); // Đảm bảo news là mảng rỗng nếu fetch lỗi
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      setNews([]); // Đảm bảo news là mảng rỗng nếu có lỗi mạng
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // <<< THÊM: Lọc danh sách tin tức bằng useMemo >>>
  const filteredNews = useMemo(() => {
    if (!searchTerm) {
      return news;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return news.filter(item =>
      item.title.toLowerCase().includes(lowerCaseSearchTerm) ||
      item.author.toLowerCase().includes(lowerCaseSearchTerm) ||
      formatNewsStatusText(item.isPublished).toLowerCase().includes(lowerCaseSearchTerm)
      // Lưu ý: Tìm kiếm trong item.content (HTML) có thể phức tạp và chậm
      // Nếu muốn tìm trong nội dung, cần strip HTML trước khi so sánh:
      // || item.content.replace(/<[^>]*>/g, '').toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [news, searchTerm]);


  // --- Handlers ---
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
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Cố gắng lấy lỗi từ body
        throw new Error(errorData.error || 'Lỗi khi lưu tin tức');
      }

      await fetchNews();
      setIsModalOpen(false);
      alert(currentNews ? 'Cập nhật thành công!' : 'Thêm tin tức thành công!');
    } catch (error) {
      console.error('Error submitting news:', error);
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
          // Cập nhật state ngay lập tức thay vì fetch lại
          setNews(prevNews => prevNews.filter(item => item._id !== newsId));
          alert('Xóa tin tức thành công!');
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Không thể xóa tin tức');
        }
      } catch (error) {
        console.error('Error deleting news:', error);
        alert(error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa');
      }
    }
  };

  // --- JSX ---
  return (
    <div className="p-6"> {/* Thêm padding bao ngoài */}
      {/* <<< CẬP NHẬT: Header với ô tìm kiếm */}
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Quản lý Tin tức</h1>
        {/* Search and Add Button Group */}
        <div className="flex items-center space-x-4">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Tìm theo tiêu đề, tác giả, status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          {/* Add Button */}
          <button
            onClick={handleAddNews}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 whitespace-nowrap text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" // Đồng bộ style button
          >
            Thêm tin tức
          </button>
        </div>
      </div>

      {/* <<< CẬP NHẬT: Hiển thị Grid hoặc thông báo không có kết quả >>> */}
      {filteredNews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* <<< CẬP NHẬT: Map qua filteredNews >>> */}
          {filteredNews.map((item) => (
            <div key={item._id} className="bg-white rounded-lg shadow overflow-hidden flex flex-col"> {/* Thêm flex flex-col */}
              <img
                src={item.image || '/placeholder-image.png'} // Thêm ảnh placeholder
                alt={item.title}
                className="w-full h-48 object-cover"
                onError={(e) => (e.currentTarget.src = '/placeholder-image.png')} // Xử lý lỗi ảnh
              />
              <div className="p-4 flex flex-col flex-grow"> {/* Thêm flex flex-col flex-grow */}
                <h3 className="text-lg font-semibold mb-2 line-clamp-2">{item.title}</h3> {/* line-clamp cho tiêu đề */}
                {/* Cắt ngắn nội dung an toàn hơn */}
                <div className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow"> {/* Thêm flex-grow */}
                  {/* Lấy text an toàn, không dùng dangerouslySetInnerHTML trừ khi thật cần thiết */}
                  {item.content.replace(/<[^>]*>/g, '').substring(0, 150)}{item.content.length > 150 ? '...' : ''}
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 mt-auto"> {/* Thêm mt-auto */}
                  <span>{item.author}</span>
                  {/* Sử dụng try-catch để tránh lỗi ngày không hợp lệ */}
                  <span>{(() => { try { return new Date(item.createdAt).toLocaleDateString('vi-VN'); } catch { return 'N/A'; } })()}</span>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ // Thêm font-semibold
                    item.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {formatNewsStatusText(item.isPublished)} {/* Sử dụng hàm helper */}
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
      ) : (
        <div className="text-center py-10 text-gray-500">
          {/* <<< CẬP NHẬT: Thông báo khi không có kết quả */}
          {searchTerm ? 'Không tìm thấy tin tức nào phù hợp.' : 'Chưa có tin tức nào.'}
        </div>
      )}


      {/* Add/Edit Modal */}
      {isModalOpen && (
        // Sử dụng kiểu modal nhất quán hơn với các trang khác
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"> {/* Giới hạn chiều cao và thêm scroll */}
            <div className="sticky top-0 bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b z-10"> {/* Header modal dính */}
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {currentNews ? 'Sửa tin tức' : 'Thêm tin tức mới'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                  </svg>
                </button>
              </div>
            </div>
            <div className="px-4 pb-4 pt-2 sm:p-6 sm:pt-2"> {/* Padding cho nội dung form */}
              <NewsForm
                news={currentNews || undefined} // Đảm bảo truyền undefined nếu null
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