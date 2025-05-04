// src/app/admin/music/page.tsx
'use client';
import { useState, useEffect, useMemo } from 'react'; // Thêm useMemo
import { Music } from '@/types/music'; // Đảm bảo đường dẫn type đúng
import MusicForm from '@/components/admin/MusicForm'; // Đảm bảo đường dẫn component đúng
import { format } from 'date-fns'; // Import date-fns để định dạng ngày
import { vi } from 'date-fns/locale/vi'; // Import locale tiếng Việt

export default function MusicManagement() {
  const [music, setMusic] = useState<Music[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMusic, setCurrentMusic] = useState<Music | null>(null);
  const [searchTerm, setSearchTerm] = useState(''); // State tìm kiếm
  const [isLoading, setIsLoading] = useState(true); // State loading
  const [error, setError] = useState<string | null>(null); // State báo lỗi

  // Hàm fetch nhạc
  const fetchMusic = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/music'); // URL API
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        // Đảm bảo image có giá trị hoặc ảnh mặc định
        const transformedData = data.map(item => ({
          ...item,
          image: item.image || '/default-music.png' // Thay bằng ảnh mặc định của bạn
        }));
        setMusic(transformedData);
      } else {
        console.error("Dữ liệu trả về không phải là mảng:", data);
        setError("Định dạng dữ liệu nhạc không hợp lệ.");
        setMusic([]);
      }
    } catch (err) {
      console.error('Error fetching music:', err);
      setError(err instanceof Error ? err.message : 'Lỗi không xác định khi tải danh sách nhạc.');
      setMusic([]); // Đặt mảng rỗng khi lỗi
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch nhạc khi component mount
  useEffect(() => {
    fetchMusic();
  }, []);

  // Lọc nhạc dựa trên searchTerm
  const filteredMusic = useMemo(() => {
    if (!searchTerm) {
      return music; // Trả về toàn bộ nếu không tìm kiếm
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return music.filter(item =>
      item.title.toLowerCase().includes(lowerCaseSearchTerm) ||
      item.artist.toLowerCase().includes(lowerCaseSearchTerm) ||
      (item.description && item.description.toLowerCase().includes(lowerCaseSearchTerm))
    );
  }, [music, searchTerm]); // Tính toán lại khi music hoặc searchTerm thay đổi

  // Xử lý submit form (Thêm/Sửa)
  const handleSubmit = async (formData: FormData) => {
    // Lấy _id từ FormData để xác định là PUT hay POST
    const musicId = formData.get('_id') as string | null;
    const isEditing = !!musicId;

    // Thêm currentImage nếu đang sửa và có ảnh cũ (không phải default)
    if (isEditing && currentMusic?.image && !currentMusic.image.includes('default-music')) {
      formData.append('currentImage', currentMusic.image);
    }
    // Nếu là sửa mà không upload file ảnh/audio mới, cần xóa field 'file' và 'audioFile' khỏi FormData
    // để tránh backend xử lý file rỗng (tùy thuộc vào logic backend)
    const imageFile = formData.get('imageFile');
    const audioFile = formData.get('audioFile');

    if (isEditing && imageFile instanceof File && imageFile.size === 0) {
      formData.delete('imageFile');
    }
    if (isEditing && audioFile instanceof File && audioFile.size === 0) {
      formData.delete('audioFile');
    }

    try {
      const url = isEditing ? `/api/music/${musicId}` : '/api/music';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formData, // Gửi trực tiếp FormData
      });

      const result = await response.json(); // Luôn parse để lấy thông tin (kể cả lỗi)

      if (response.ok) {
        await fetchMusic(); // Tải lại danh sách
        setIsModalOpen(false);
        setCurrentMusic(null); // Reset
        alert(isEditing ? 'Cập nhật bài hát thành công!' : 'Thêm bài hát thành công!');
      } else {
        throw new Error(result.error || `Không thể ${isEditing ? 'cập nhật' : 'thêm'} bài hát.`);
      }
    } catch (error) {
      console.error('Error saving music:', error);
      alert(error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu bài hát.');
    }
  };

  // Mở modal thêm mới
  const handleAddMusic = () => {
    setCurrentMusic(null);
    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleEditMusic = (item: Music) => {
    setCurrentMusic(item);
    setIsModalOpen(true);
  };

  // Xử lý xóa nhạc
  const handleDeleteMusic = async (musicId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài hát này?')) {
      try {
        const response = await fetch(`/api/music/${musicId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // Cập nhật state trực tiếp để phản hồi nhanh hơn
          setMusic(prevMusic => prevMusic.filter(item => item._id !== musicId));
          alert('Xóa bài hát thành công!');
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Có lỗi xảy ra khi xóa' }));
          throw new Error(errorData.error || `Lỗi ${response.status} khi xóa bài hát.`);
        }
      } catch (error) {
        console.error('Error deleting music:', error);
        alert(error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa bài hát.');
      }
    }
  };

  // Định dạng ngày tháng
  const formatDate = (dateString: Date | string): string => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: vi });
    } catch {
      return "Ngày không hợp lệ";
    }
  }

  return (
    <div className="p-6">
      {/* Header: Tiêu đề, Tìm kiếm, Nút thêm */}
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Âm nhạc</h1>
        <div className="flex items-center space-x-4">
          {/* Ô tìm kiếm */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Tìm theo tên bài hát, ca sĩ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
            />
          </div>
          {/* Nút thêm */}
          <button
            onClick={handleAddMusic}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Thêm bài hát
          </button>
        </div>
      </div>

      {/* Hiển thị Loading hoặc Error */}
      {isLoading && <p className="text-center text-gray-500 py-4">Đang tải danh sách nhạc...</p>}
      {error && <p className="text-center text-red-500 py-4">Lỗi: {error}</p>}

      {/* Bảng nhạc */}
      {!isLoading && !error && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bài hát
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ca sĩ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Audio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Sử dụng filteredMusic */}
              {filteredMusic.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    {searchTerm ? 'Không tìm thấy bài hát nào phù hợp.' : 'Chưa có bài hát nào.'}
                  </td>
                </tr>
              ) : (
                filteredMusic.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            className="h-10 w-10 rounded-md object-cover" // Đổi sang rounded-md nếu muốn vuông hơn
                            src={item.image || '/default-music.png'}
                            alt={item.title}
                            onError={(e) => (e.currentTarget.src = '/default-music.png')} // Xử lý lỗi ảnh
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {item.title}
                          </div>
                          {item.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs" title={item.description}>
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.artist}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* Cập nhật player audio nhỏ gọn hơn */}
                      {item.audio ? (
                        <audio controls className="w-full max-w-[200px] h-8" controlsList="nodownload noplaybackrate"> {/* Style gọn hơn */}
                          <source src={item.audio} type="audio/mpeg" />
                          Trình duyệt không hỗ trợ audio.
                        </audio>
                      ) : (
                        <span className="text-sm text-gray-400">Không có file</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatDate(item.createdAt)} {/* Định dạng ngày giờ */}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {item.isPublished ? 'Đã xuất bản' : 'Bản nháp'} {/* Đổi thành Bản nháp cho rõ */}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"> {/* Căn phải */}
                      <button
                        onClick={() => handleEditMusic(item)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                        aria-label={`Sửa ${item.title}`}
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteMusic(item._id)}
                        className="text-red-600 hover:text-red-900"
                        aria-label={`Xóa ${item.title}`}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Thêm/Sửa Nhạc */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-75 transition-opacity flex items-center justify-center p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg shadow-xl transform transition-all sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      {currentMusic ? 'Sửa thông tin bài hát' : 'Thêm bài hát mới'}
                    </h3>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="text-gray-400 hover:text-gray-600"
                      aria-label="Đóng modal"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <MusicForm
                    music={currentMusic || undefined} // Truyền undefined thay vì null nếu component con yêu cầu
                    onSubmit={handleSubmit}
                    onCancel={() => setIsModalOpen(false)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}