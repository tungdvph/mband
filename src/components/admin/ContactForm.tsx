// components/admin/auth/ContactForm.tsx
'use client';
import { useState, useEffect } from 'react';
import { Contact } from '@/types/contact'; // Đảm bảo đường dẫn đúng

interface ContactFormProps {
  contact?: Contact; // contact có thể là undefined khi thêm mới
  onSubmit: (data: Omit<FormData, 'createdAt'> & { _id?: string }) => void; // Gửi dữ liệu không bao gồm createdAt (thường do DB quản lý)
  onCancel: () => void;
}

// Interface cho state của form
interface FormData {
  _id?: string;
  name: string;
  email: string;
  phone: string; // Luôn là string trong state
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  createdAt: string; // Chỉ dùng để hiển thị, không gửi đi
}

const ContactForm = ({ contact, onSubmit, onCancel }: ContactFormProps) => {
  // Khởi tạo state cho form
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '', // Khởi tạo là chuỗi rỗng
    subject: '',
    message: '',
    status: 'new',
    createdAt: new Date().toISOString() // Mặc định là ngày giờ hiện tại
  });

  // useEffect để cập nhật form khi prop `contact` thay đổi (khi xem/sửa)
  useEffect(() => {
    if (contact) {
      // Nếu có contact (chế độ xem/sửa), điền dữ liệu vào form
      setFormData({
        _id: contact._id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone ?? '', // Dùng '' nếu phone là null/undefined
        subject: contact.subject,
        message: contact.message,
        status: contact.status,
        createdAt: new Date(contact.createdAt).toISOString() // Lấy createdAt từ contact
      });
    } else {
      // Nếu không có contact (chế độ thêm mới hoặc khi đóng modal), reset form
      setFormData({
        _id: undefined, // Đảm bảo không có _id khi thêm mới
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        status: 'new',
        createdAt: new Date().toISOString() // Reset createdAt về hiện tại
      });
    }
  }, [contact]); // Dependency array là contact

  // Xử lý khi submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { createdAt, ...dataToSubmit } = formData; // Loại bỏ createdAt trước khi gửi
    onSubmit(dataToSubmit); // Gửi dữ liệu đã loại bỏ createdAt
  };

  // Kiểm tra xem có đang ở chế độ xem/sửa không (để disable các trường)
  const isViewingOrEditing = !!contact;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Hàng 1: Tên, Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700">Tên</label>
          <input
            id="contact-name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
            required
            disabled={isViewingOrEditing} // Disable khi xem/sửa
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700">Email</label>
          <input
            id="contact-email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
            required
            disabled={isViewingOrEditing} // Disable khi xem/sửa
          />
        </div>
      </div>

      {/* Hàng 2: Số điện thoại, Trạng thái */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700">Số điện thoại</label>
          <input
            id="contact-phone"
            type="tel"
            value={formData.phone} // Luôn là string
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
            // không bắt buộc required vì phone là optional
            disabled={isViewingOrEditing} // Disable khi xem/sửa
          />
        </div>
        <div>
          <label htmlFor="contact-status" className="block text-sm font-medium text-gray-700">Trạng thái</label>
          <select
            id="contact-status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'new' | 'read' | 'replied' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          // Cho phép thay đổi status cả khi thêm mới và khi xem/sửa
          >
            <option value="new">Mới</option>
            <option value="read">Đã đọc</option>
            <option value="replied">Đã trả lời</option>
          </select>
        </div>
      </div>

      {/* Tiêu đề */}
      <div>
        <label htmlFor="contact-subject" className="block text-sm font-medium text-gray-700">Tiêu đề</label>
        <input
          id="contact-subject"
          type="text"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
          required
          disabled={isViewingOrEditing} // Disable khi xem/sửa
        />
      </div>

      {/* Nội dung */}
      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700">Nội dung</label>
        <textarea
          id="contact-message"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          rows={5}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
          required
          disabled={isViewingOrEditing} // Disable khi xem/sửa
        />
      </div>

      {/* Ngày tạo (chỉ hiển thị khi xem/sửa) */}
      {isViewingOrEditing && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Ngày nhận</label>
          <input
            type="text"
            value={new Date(formData.createdAt).toLocaleString('vi-VN')} // Format ngày giờ Việt Nam
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-100"
            disabled
          />
        </div>
      )}


      {/* Nút bấm */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Hủy
        </button>

        {/* Chỉ hiển thị nút Cập nhật khi đang xem/sửa */}
        {isViewingOrEditing && (
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cập nhật trạng thái
          </button>
        )}

        {/* Chỉ hiển thị nút Thêm khi đang thêm mới (contact là null/undefined) */}
        {/* KHỐI NÀY ĐÃ ĐƯỢC BỎ COMMENT */}
        {!isViewingOrEditing && (
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Thêm mới
          </button>
        )}
        {/* KHỐI NÀY ĐÃ ĐƯỢC BỎ COMMENT */}
      </div>
    </form>
  );
};

export default ContactForm;