// /app/(public)/booking/page.tsx (hoặc .js)
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import BookingRequestForm from '@/components/forms/BookingRequestForm';
import { useEffect, useState } from 'react'; // Import useState

export default function BookingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubmitted, setIsSubmitted] = useState(false); // State mới: đã gửi thành công chưa?
  const [formKey, setFormKey] = useState(Date.now()); // State mới: key để reset form

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/login');
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          Đang tải...
        </div>
      </Layout>
    );
  }

  if (status === "authenticated" && !session) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          Không thể lấy thông tin người dùng. Vui lòng thử lại.
        </div>
      </Layout>
    )
  }

  const handleBooking = async (formDataFromForm: any) => {
    if (!session?.user?.id) {
      alert('Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
      router.push('/login');
      return;
    }

    const submitData = new FormData();
    // ... (append các trường vào submitData như trước)
    submitData.append('eventName', formDataFromForm.eventName);
    submitData.append('eventDate', formDataFromForm.eventDate);
    submitData.append('location', formDataFromForm.location);
    submitData.append('eventType', formDataFromForm.eventType);
    submitData.append('duration', formDataFromForm.duration.toString());
    submitData.append('expectedGuests', formDataFromForm.expectedGuests.toString());
    submitData.append('requirements', formDataFromForm.requirements || '');
    submitData.append('budget', formDataFromForm.budget?.toString() || '0');
    submitData.append('contactName', formDataFromForm.contactName);
    submitData.append('contactPhone', formDataFromForm.contactPhone);
    submitData.append('contactEmail', formDataFromForm.contactEmail);

    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        body: submitData,
      });

      if (response.ok) {
        // alert('Yêu cầu đặt lịch của bạn đã được gửi thành công!'); // Có thể bỏ alert nếu UI mới đủ rõ ràng
        setIsSubmitted(true); // <-- Thay đổi ở đây: Đặt trạng thái thành công
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Gửi yêu cầu thất bại' }));
        alert(`Lỗi: ${errorData.error || 'Không thể gửi yêu cầu. Vui lòng kiểm tra lại thông tin.'}`);
      }
    } catch (error) {
      console.error('Error making booking:', error);
      alert('Có lỗi hệ thống xảy ra khi gửi yêu cầu. Vui lòng thử lại sau.');
    }
  };

  // Hàm xử lý khi nhấn nút "Gửi thêm yêu cầu khác"
  const handleSendAnotherRequest = () => {
    setIsSubmitted(false); // Reset trạng thái thành công
    setFormKey(Date.now()); // Thay đổi key để reset form
  };

  // Hàm xử lý khi nhấn nút "Quay về trang chủ"
  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">Đặt lịch thuê ban nhạc</h1>

          {/* Render có điều kiện */}
          {!isSubmitted ? (
            // Nếu chưa gửi thành công -> hiển thị form
            <>
              <p className="text-gray-600 mb-8 text-center">
                Vui lòng điền đầy đủ thông tin chi tiết về sự kiện của bạn dưới đây. Chúng tôi sẽ liên hệ lại sớm nhất có thể.
              </p>
              {/* Truyền key vào Form */}
              <BookingRequestForm key={formKey} onSubmit={handleBooking} />
            </>
          ) : (
            // Nếu đã gửi thành công -> hiển thị thông báo và nút
            <div className="text-center bg-green-50 border border-green-200 p-8 rounded-lg shadow-md">
              <svg className="mx-auto mb-4 w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">Gửi yêu cầu thành công!</h2>
              <p className="text-gray-700 mb-6">
                Cảm ơn bạn đã đặt lịch. Chúng tôi đã nhận được thông tin và sẽ liên hệ lại với bạn sớm nhất qua email hoặc điện thoại đã cung cấp.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleSendAnotherRequest}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  Gửi thêm yêu cầu khác
                </button>
                <button
                  onClick={handleGoHome}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
                >
                  Quay về trang chủ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}