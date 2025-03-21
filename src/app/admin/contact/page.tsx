'use client';
import { useState, useEffect } from 'react';
import { Contact } from '@/types/contact';
import ContactForm from '@/components/admin/ContactForm';

export default function ContactManagement() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentContact, setCurrentContact] = useState<Contact | null>(null);

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/contacts');
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleAddContact = () => {
    setCurrentContact(null);
    setIsModalOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setCurrentContact(contact);
    setIsModalOpen(true);
  };

  const handleDeleteContact = async (contactId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa liên hệ này?')) {
      try {
        const response = await fetch(`/api/contacts/${contactId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setContacts(contacts.filter(contact => contact._id !== contactId));
        }
      } catch (error) {
        console.error('Error deleting contact:', error);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý Liên hệ</h1>
        <button
          onClick={handleAddContact}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Thêm liên hệ
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Người gửi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Chủ đề
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày gửi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contacts.map((contact) => (
              <tr key={contact._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                    <div className="text-sm text-gray-500">{contact.email}</div>
                    <div className="text-sm text-gray-500">{contact.phone}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{contact.subject}</div>
                  <div className="text-sm text-gray-500 truncate max-w-xs">
                    {contact.message}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(contact.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    contact.status === 'new' ? 'bg-yellow-100 text-yellow-800' :
                    contact.status === 'read' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {contact.status === 'new' ? 'Mới' :
                     contact.status === 'read' ? 'Đã đọc' : 'Đã trả lời'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEditContact(contact)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Xem
                  </button>
                  <button 
                    onClick={() => handleDeleteContact(contact._id)}
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">
              {currentContact ? 'Chi tiết liên hệ' : 'Thêm liên hệ mới'}
            </h2>
            <ContactForm
              contact={currentContact || undefined}
              onSubmit={async (data) => {
                try {
                  const url = data._id ? `/api/contacts/${data._id}` : '/api/contacts';
                  const method = data._id ? 'PUT' : 'POST';

                  const response = await fetch(url, {
                    method,
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                  });

                  if (response.ok) {
                    await fetchContacts();
                    setIsModalOpen(false);
                  }
                } catch (error) {
                  console.error('Error saving contact:', error);
                }
              }}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}