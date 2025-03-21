'use client';
import { useState } from 'react';
import { Music } from '@/types/music';

interface MusicFormProps {
  music?: Music;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
}

export default function MusicForm({ music, onSubmit, onCancel }: MusicFormProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(music?.image || '/default-album.png');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isPublished, setIsPublished] = useState(music?.isPublished || false); // Thêm state này

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    if (imageFile) {
      formData.append('image', imageFile);
    }
    if (audioFile) {
      formData.append('audio', audioFile);
    }
    if (music?._id) {
      formData.append('_id', music._id);
    }
    formData.append('isPublished', isPublished.toString()); // Thêm dòng này

    onSubmit(formData);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Ảnh bài hát</label>
          <div className="mt-1 flex items-center space-x-4">
            <img 
              src={imagePreview} 
              alt="Album preview" 
              className="h-32 w-32 object-cover rounded"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tên bài hát</label>
          <input
            type="text"
            name="title"
            defaultValue={music?.title}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Mô tả</label>
          <textarea
            name="description"
            defaultValue={music?.description}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">File âm thanh</label>
          <input
            type="file"
            accept="audio/*"
            onChange={handleAudioChange}
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Ca sĩ/Nhóm nhạc</label>
          <input
            type="text"
            name="artist"
            defaultValue={music?.artist}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          />
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isPublished"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            <span className="ml-2">Xuất bản</span>
          </label>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {music ? 'Cập nhật' : 'Thêm'}
          </button>
        </div>
      </div>
    </form>
  );
}