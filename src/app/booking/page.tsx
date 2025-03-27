'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import BookingForm from '@/components/forms/BookingRequestForm';  // Đã đúng tên file
import { useEffect } from 'react';

export default function BookingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/login');
    }
  }, [status, router]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  const handleBooking = async (formData: any) => {
    if (!session?.user?.id) {
      alert('Vui lòng đăng nhập để đặt lịch!');
      router.push('/login');
      return;
    }

    try {
      const bookingData = {
        ...formData,
        userId: session.user.id
      };

      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (response.ok) {
        alert('Yêu cầu đặt lịch đã được gửi thành công!');
        router.push('/profile');
      } else {
        alert('Gửi yêu cầu thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error making booking:', error);
      alert('Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Đặt lịch thuê ban nhạc</h1>
          <p className="text-gray-600 mb-8">
            Hãy điền thông tin chi tiết về sự kiện của bạn để chúng tôi có thể hỗ trợ tốt nhất.
          </p>
          <BookingForm onSubmit={handleBooking} />
        </div>
      </div>
    </Layout>
  );
}