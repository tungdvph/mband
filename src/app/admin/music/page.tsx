'use client';
import { useState, useEffect } from 'react';
import { Music } from '@/types/music';
import MusicForm from '@/components/admin/MusicForm';

export default function MusicManagement() {
  const [music, setMusic] = useState<Music[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMusic, setCurrentMusic] = useState<Music | null>(null);

  useEffect(() => {
    fetchMusic();
  }, []);

  const fetchMusic = async () => {
    try {
      const response = await fetch('/api/music');
      if (response.ok) {
        const data = await response.json();
        setMusic(data);
      }
    } catch (error) {
      console.error('Error fetching music:', error);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    try {
      const url = formData.get('_id') ? `/api/music/${formData.get('_id')}` : '/api/music';
      const method = formData.get('_id') ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formData, // Gửi trực tiếp FormData
      });

      if (response.ok) {
        await fetchMusic();
        setIsModalOpen(false);
      } else {
        console.error('Error saving music:', await response.text());
      }
    } catch (error) {
      console.error('Error saving music:', error);
    }
  };

  const handleAddMusic = () => {
    setCurrentMusic(null);
    setIsModalOpen(true);
  };

  const handleEditMusic = (item: Music) => {
    setCurrentMusic(item);
    setIsModalOpen(true);
  };

  const handleDeleteMusic = async (musicId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài hát này?')) {
      try {
        const response = await fetch(`/api/music/${musicId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setMusic(music.filter(item => item._id !== musicId));
        } else {
          alert('Có lỗi xảy ra khi xóa bài hát');
        }
      } catch (error) {
        console.error('Error deleting music:', error);
        alert('Có lỗi xảy ra khi xóa bài hát');
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý Âm nhạc</h1>
        <button
          onClick={handleAddMusic}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Thêm bài hát
        </button>
      </div>

      {/* Music Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {music.map((item) => (
              <tr key={item._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img
                      className="h-10 w-10 rounded-full"
                      src={item.image || '/default-music.png'}  // Added default image
                      alt={item.title}
                    />
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {item.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.description}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{item.artist}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <audio controls className="w-32">
                    <source src={item.audio} type="audio/mpeg" />
                  </audio>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    item.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {item.isPublished ? 'Đã xuất bản' : 'Chưa xuất bản'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEditMusic(item)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Sửa
                  </button>
                  <button 
                    onClick={() => handleDeleteMusic(item._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">
              {currentMusic ? 'Sửa bài hát' : 'Thêm bài hát mới'}
            </h2>
            <MusicForm
              music={currentMusic || undefined}
              onSubmit={handleSubmit}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}