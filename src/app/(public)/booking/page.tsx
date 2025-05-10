// /app/(public)/booking/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import BookingRequestForm from '@/components/forms/BookingRequestForm'; // Đảm bảo form này phù hợp
import { useState } from 'react';
import { IBookingRequest } from '@/lib/models/BookingRequest'; // Import interface từ file model

export default function BookingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formKey, setFormKey] = useState(Date.now());
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Định nghĩa kiểu cho dữ liệu nhận từ form.
  // eventDate từ form sẽ là string, các trường khác khớp với IBookingRequest
  // nhưng không bao gồm _id, createdAt, updatedAt, status (sẽ có default), userId (nếu không gửi từ client)
  type BookingFormData = Omit<IBookingRequest, '_id' | 'createdAt' | 'updatedAt' | 'status' | 'userId' | 'eventDate'> & {
    eventDate: string; // eventDate từ input type="datetime-local" là string
  };

  const handleBooking = async (formDataFromForm: BookingFormData) => {
    setSubmissionError(null); // Reset lỗi trước khi gửi

    const submitData = new FormData();
    submitData.append('eventName', formDataFromForm.eventName);
    submitData.append('eventDate', formDataFromForm.eventDate); // Form nên gửi dưới dạng YYYY-MM-DDTHH:mm
    submitData.append('location', formDataFromForm.location);
    submitData.append('eventType', formDataFromForm.eventType);
    submitData.append('duration', formDataFromForm.duration.toString());
    submitData.append('expectedGuests', formDataFromForm.expectedGuests.toString());
    submitData.append('requirements', formDataFromForm.requirements || '');
    submitData.append('budget', formDataFromForm.budget?.toString() || ''); // Gửi chuỗi rỗng nếu không có budget, backend sẽ xử lý thành null/0
    submitData.append('contactName', formDataFromForm.contactName);
    submitData.append('contactPhone', formDataFromForm.contactPhone);
    submitData.append('contactEmail', formDataFromForm.contactEmail);

    // Nếu bạn muốn gửi userId từ client (cân nhắc bảo mật, tốt hơn là lấy từ server session)
    // if (session?.user?.id) {
    //     submitData.append('userId', session.user.id);
    // }

    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        body: submitData,
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Gửi yêu cầu thất bại. Không thể phân tích phản hồi lỗi.' }));
        console.error("Booking error response:", errorData);
        setSubmissionError(`Lỗi: ${errorData.error || errorData.message || 'Không thể gửi yêu cầu. Vui lòng kiểm tra lại thông tin.'}`);
      }
    } catch (error: any) {
      console.error('Error making booking:', error);
      setSubmissionError('Có lỗi hệ thống xảy ra khi gửi yêu cầu. Vui lòng thử lại sau.');
    }
  };

  const handleSendAnotherRequest = () => {
    setIsSubmitted(false);
    setSubmissionError(null);
    setFormKey(Date.now());
  };

  const handleGoHome = () => {
    router.push('/');
  };

  if (status === "loading") {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </Layout>
    );
  }

  // Bỏ qua kiểm tra session ở đây nếu bạn muốn cho phép người dùng chưa đăng nhập vẫn thấy form
  // và việc kiểm tra đăng nhập (nếu cần thiết) được thực hiện ở backend khi POST
  if (status === "unauthenticated") {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto bg-yellow-50 border border-yellow-300 p-8 rounded-lg shadow-lg text-center">
            <svg className="mx-auto mb-4 w-12 h-12 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
            </svg>
            <h2 className="text-2xl font-semibold text-yellow-800 mb-4">Yêu cầu Đăng nhập</h2>
            <p className="text-gray-700 mb-6">
              Bạn cần đăng nhập để sử dụng tính năng đặt lịch này.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => router.push('/login')}
                className="px-6 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out w-full sm:w-auto"
              >
                Đăng nhập
              </button>
              <button
                onClick={handleGoHome}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md shadow hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition duration-150 ease-in-out w-full sm:w-auto"
              >
                Quay về trang chủ
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (status === "authenticated" && !session) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center text-red-600">
          <h2 className="text-2xl font-semibold mb-4">Lỗi</h2>
          <p className="mb-4">Không thể lấy thông tin người dùng. Vui lòng thử đăng nhập lại.</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
          >
            Đăng nhập
          </button>
        </div>
      </Layout>
    );
  }

  // Chỉ render form khi status là "authenticated" và có session, HOẶC nếu bạn cho phép người chưa đăng nhập đặt
  // Nếu bạn muốn chỉ người đã đăng nhập mới thấy form, hãy giữ lại điều kiện `status === "authenticated" && session`
  // Hiện tại, code đã có phần xử lý `status === "unauthenticated"` ở trên, nên nếu qua được đó thì đã đăng nhập hoặc bạn không check
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
          {!isSubmitted ? (
            <>
              <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center text-gray-800">Đặt lịch thuê ban nhạc</h1>
              <p className="text-gray-600 mb-8 text-center">
                Vui lòng điền đầy đủ thông tin chi tiết về sự kiện của bạn dưới đây. Chúng tôi sẽ liên hệ lại sớm nhất có thể.
              </p>
              {submissionError && (
                <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                  <span className="font-medium">Lỗi!</span> {submissionError}
                </div>
              )}
              {/*
                                Đảm bảo BookingRequestForm của bạn gọi onSubmit với một đối tượng
                                có các thuộc tính khớp với BookingFormData.
                                Bạn có thể cần ép kiểu `handleBooking as any` nếu BookingRequestForm
                                không được type một cách chặt chẽ.
                            */}
              <BookingRequestForm key={formKey} onSubmit={handleBooking as any} />
            </>
          ) : (
            <div className="text-center bg-green-50 border border-green-300 p-8 rounded-lg shadow-md">
              <svg className="mx-auto mb-4 w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <h2 className="text-2xl font-semibold text-green-800 mb-4">Gửi yêu cầu thành công!</h2>
              <p className="text-gray-700 mb-6">
                Cảm ơn bạn đã đặt lịch. Chúng tôi đã nhận được thông tin và sẽ liên hệ lại với bạn sớm nhất qua email hoặc điện thoại đã cung cấp.
              </p>
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={handleSendAnotherRequest}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out w-full sm:w-auto"
                >
                  Gửi thêm yêu cầu khác
                </button>
                <button
                  onClick={handleGoHome}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md shadow hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition duration-150 ease-in-out w-full sm:w-auto"
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