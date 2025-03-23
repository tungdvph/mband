'use client';
import { useState } from 'react';
import { Member } from '@/types/member';

interface MemberFormProps {
  member?: Member | null;  // Thêm | null vào đây
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
}

export default function MemberForm({ member, onSubmit, onCancel }: MemberFormProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(member?.image || '/default-avatar.png');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Xử lý file ảnh
    if (imageFile) {
      formData.set('image', imageFile); // Đổi từ 'file' thành 'image'
    }

    // Thêm trường isActive
    formData.set('isActive', (e.currentTarget.querySelector('[name="isActive"]') as HTMLInputElement).checked.toString());

    try {
      onSubmit(formData);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Ảnh</label>
          <div className="mt-1 flex items-center space-x-4">
            <img 
              src={imagePreview} 
              alt="Member preview" 
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
          <label className="block text-sm font-medium text-gray-700">Tên thành viên</label>
          <input
            type="text"
            name="name"
            defaultValue={member?.name}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Vai trò</label>
          <input
            type="text"
            name="role"
            defaultValue={member?.role}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Mô tả</label>
          <textarea
            name="description"
            defaultValue={member?.description}
            rows={4}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={member?.isActive ?? true}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Đang hoạt động</span>
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {member ? 'Cập nhật' : 'Thêm'}
          </button>
        </div>
      </div>
    </form>
  );
}