'use client';
import { useState, useEffect } from 'react';
import { Contact } from '@/types/contact';

interface ContactFormProps {
  contact?: Contact;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

interface FormData {
  _id?: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  createdAt: string;
}

const ContactForm = ({ contact, onSubmit, onCancel }: ContactFormProps) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    status: 'new',
    createdAt: new Date().toISOString()
  });

  useEffect(() => {
    if (contact) {
      setFormData({
        _id: contact._id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        subject: contact.subject,
        message: contact.message,
        status: contact.status,
        createdAt: new Date(contact.createdAt).toISOString()
      });
    }
  }, [contact]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isEditing = !!contact; // Kiểm tra xem đang sửa hay thêm mới

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Tên</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
            disabled={isEditing}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
            disabled={isEditing}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
            disabled={isEditing}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="new">Mới</option>
            <option value="read">Đã đọc</option>
            <option value="replied">Đã trả lời</option>
          </select>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Tiêu đề</label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
            disabled={isEditing}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Nội dung</label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
            disabled={isEditing}
          />
        </div>
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
          {contact ? 'Cập nhật' : 'Thêm'}
        </button>
      </div>
    </form>
  );
};

export default ContactForm;