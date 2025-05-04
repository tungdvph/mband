// /app/admin/contact/page.tsx
'use client';
import { useState, useEffect, useMemo } from 'react';
import { Contact } from '@/types/contact';
import ContactForm from '@/components/admin/ContactForm';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale/vi';

// <<< BƯỚC 1: Định nghĩa kiểu dữ liệu mà ContactForm gửi đi >>>
// Chỉ chứa các trường có trong form và _id nếu sửa
interface ContactFormData {
  _id?: string; // _id có thể có hoặc không
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  // Không bao gồm createdAt, updatedAt vì chúng không phải do người dùng nhập
}


export default function ContactManagement() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentContact, setCurrentContact] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ... (fetchContacts, formatters, filteredContacts, handleAddContact, handleEditContact không đổi) ...

  const fetchContacts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/contact');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setContacts(data);
      } else {
        console.error("Dữ liệu trả về không phải là mảng:", data);
        setError("Định dạng dữ liệu liên hệ không hợp lệ.");
        setContacts([]);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError(err instanceof Error ? err.message : 'Lỗi không xác định khi tải danh sách liên hệ.');
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const formatContactStatus = (status: Contact['status'] | undefined): string => {
    if (!status) return 'N/A';
    switch (status) {
      case 'new': return 'Mới';
      case 'read': return 'Đã đọc';
      case 'replied': return 'Đã trả lời';
      default: return status;
    }
  }

  const formatDateTime = (dateString: Date | string | undefined | null): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Ngày không hợp lệ';
      }
      return format(date, 'dd/MM/yyyy HH:mm', { locale: vi });
    } catch (e) {
      console.error("Error formatting date:", e);
      return 'Ngày không hợp lệ';
    }
  }

  const filteredContacts = useMemo(() => {
    if (!searchTerm) {
      return contacts;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      contact.email.toLowerCase().includes(lowerCaseSearchTerm) ||
      (contact.phone && contact.phone.includes(lowerCaseSearchTerm)) ||
      contact.subject.toLowerCase().includes(lowerCaseSearchTerm) ||
      contact.message.toLowerCase().includes(lowerCaseSearchTerm) ||
      formatContactStatus(contact.status).toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [contacts, searchTerm]);

  const handleAddContact = () => {
    setCurrentContact(null);
    setIsModalOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    if (contact.status === 'new') {
      setContacts(prev => prev.map(c => c._id === contact._id ? { ...c, status: 'read' } : c));
      fetch(`/api/contact/${contact._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'read' }),
      }).catch(err => {
        console.error("Lỗi cập nhật trạng thái 'read':", err);
      });
    }
    setCurrentContact({ ...contact, status: contact.status === 'new' ? 'read' : contact.status });
    setIsModalOpen(true);
  };

  const handleDeleteContact = async (contactId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa liên hệ này?')) {
      try {
        const response = await fetch(`/api/contact/${contactId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setContacts(prevContacts => prevContacts.filter(contact => contact._id !== contactId));
          alert('Xóa liên hệ thành công!');
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Có lỗi xảy ra khi xóa' }));
          throw new Error(errorData.error || `Lỗi ${response.status} khi xóa.`);
        }
      } catch (error) {
        console.error('Error deleting contact:', error);
        alert(error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa liên hệ.');
      }
    }
  };

  // <<< BƯỚC 2: Cập nhật chữ ký hàm handleSubmitContact >>>
  const handleSubmitContact = async (formDataFromForm: ContactFormData) => { // Sử dụng kiểu ContactFormData
    const isEditing = !!formDataFromForm._id;
    try {
      const url = isEditing ? `/api/contact/${formDataFromForm._id}` : '/api/contact';
      const method = isEditing ? 'PUT' : 'POST';

      // <<< BƯỚC 3: Sử dụng dữ liệu từ formDataFromForm >>>
      // Chỉ gửi status khi sửa trong form này (giả định các trường khác là read-only trong modal view)
      // Nếu là POST (thêm mới - trường hợp này đã ẩn nút), gửi các trường cần thiết
      const bodyData = isEditing
        ? { status: formDataFromForm.status }
        : {
          name: formDataFromForm.name,
          email: formDataFromForm.email,
          phone: formDataFromForm.phone,
          subject: formDataFromForm.subject,
          message: formDataFromForm.message,
          // status sẽ mặc định là 'new' ở backend
        };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Có lỗi xảy ra' }));
        throw new Error(errorData.error || `Không thể ${isEditing ? 'cập nhật' : 'thêm mới'} liên hệ.`);
      }

      await fetchContacts();
      setIsModalOpen(false);
      setCurrentContact(null);
      alert(isEditing ? 'Cập nhật trạng thái thành công!' : 'Thêm mới liên hệ thành công!');

    } catch (error) {
      console.error('Error saving contact:', error);
      alert(error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu liên hệ.');
    }
  };


  // === RENDER JSX ===
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Liên hệ</h1>
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
              placeholder="Tìm tên, email, sđt, chủ đề..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out disabled:bg-gray-100"
            />
          </div>
          {/* Nút thêm đã bị ẩn */}
        </div>
      </div>

      {/* Loading / Error State */}
      {isLoading && <p className="text-center text-gray-500 py-4">Đang tải danh sách liên hệ...</p>}
      {error && <p className="text-center text-red-500 py-4">Lỗi: {error}</p>}

      {/* Bảng hiển thị */}
      {!isLoading && !error && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người gửi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Chủ đề & Tin nhắn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày gửi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    {searchTerm ? 'Không tìm thấy liên hệ nào phù hợp.' : 'Chưa có liên hệ nào.'}
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr key={contact._id} className={`hover:bg-gray-50 ${contact.status === 'new' ? 'bg-yellow-50' : ''}`}>
                    {/* Người gửi */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                      <div className="text-sm text-gray-500">{contact.email}</div>
                      {contact.phone && <div className="text-sm text-gray-500">{contact.phone}</div>}
                    </td>
                    {/* Chủ đề & Tin nhắn */}
                    <td className="px-6 py-4 max-w-md">
                      <div className="text-sm font-semibold text-gray-800">{contact.subject}</div>
                      <div className="text-sm text-gray-600 mt-1 line-clamp-3" title={contact.message}>
                        {contact.message}
                      </div>
                    </td>
                    {/* Ngày gửi */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(contact.createdAt)}
                    </td>
                    {/* Trạng thái */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${contact.status === 'new' ? 'bg-yellow-100 text-yellow-800' :
                        contact.status === 'read' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                        {formatContactStatus(contact.status)}
                      </span>
                    </td>
                    {/* Thao tác */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditContact(contact)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                        aria-label={`Xem chi tiết liên hệ từ ${contact.name}`}
                      >
                        {contact.status === 'new' ? 'Đọc & Xem' : 'Xem'}
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact._id)}
                        className="text-red-600 hover:text-red-900"
                        aria-label={`Xóa liên hệ từ ${contact.name}`}
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

      {/* Modal */}
      {isModalOpen && currentContact && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-75 transition-opacity flex items-center justify-center p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg shadow-xl transform transition-all sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-xl font-semibold text-gray-800" id="modal-title">
                  Chi tiết Liên hệ
                </h2>
                <button
                  onClick={() => { setIsModalOpen(false); setCurrentContact(null); }}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Đóng modal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <ContactForm
                contact={currentContact}
                // Truyền hàm handleSubmitContact đã được định nghĩa đúng kiểu
                onSubmit={handleSubmitContact}
                onCancel={() => { // Đổi tên prop thành onCancel
                  setIsModalOpen(false);
                  setCurrentContact(null);
                }}
                isDetailView={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}