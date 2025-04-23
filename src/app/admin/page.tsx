'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [stats, setStats] = useState({
    users: 0,
    bookings: 0,
    songs: 0,
    contacts: 0
  });

  const [revenueData, setRevenueData] = useState({
    labels: [],
    data: []
  });

  const [bookingStatus, setBookingStatus] = useState({
    labels: ['Đã xác nhận', 'Chờ xác nhận', 'Đã hủy'],
    data: [0, 0, 0]
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
      return;
    }

    if (status === 'authenticated' && (!session?.user || session.user.role !== 'admin')) {
      router.push('/admin/login');
      return;
    }
  }, [status, router, session]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      const fetchData = async () => {
        try {
          const [statsRes, revenueRes, bookingRes] = await Promise.all([
            fetch('/api/stats'),
            fetch('/api/stats/revenue'),
            fetch('/api/stats/booking-status')
          ]);

          const statsData = await statsRes.json();
          const revenueData = await revenueRes.json();
          const bookingData = await bookingRes.json();

          setStats(statsData);
          setRevenueData({
            labels: revenueData.map((item: any) => item.month),
            data: revenueData.map((item: any) => item.revenue)
          });
          setBookingStatus({
            labels: ['Đã xác nhận', 'Chờ xác nhận', 'Đã hủy'],
            data: [bookingData.confirmed, bookingData.pending, bookingData.cancelled]
          });
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };

      fetchData();
    }
  }, [status, session]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Đang tải...</div>
      </div>
    );
  }

  if (!session?.user || session.user.role !== 'admin') {
    return null;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Bảng điều khiển Admin</h1>
      <div className="mb-8">
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Thông tin tài khoản</h2>
          <p>Tên đăng nhập: {session.user.username}</p>
          <p>Họ tên: {session.user.fullName}</p>
          <p>Email: {session.user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-500 text-white p-6 rounded-lg">
          <h3 className="text-xl mb-2">Tổng số Users: {stats.users}</h3>
          <p>Chi tiết</p>
        </div>
        <div className="bg-yellow-500 text-white p-6 rounded-lg">
          <h3 className="text-xl mb-2">Tổng số Bookings: {stats.bookings}</h3>
          <p>Chi tiết</p>
        </div>
        <div className="bg-green-500 text-white p-6 rounded-lg">
          <h3 className="text-xl mb-2">Tổng số bài hát: {stats.songs}</h3>
          <p>Chi tiết</p>
        </div>
        <div className="bg-teal-500 text-white p-6 rounded-lg">
          <h3 className="text-xl mb-2">Tổng số Liên hệ: {stats.contacts}</h3>
          <p>Chi tiết</p>
        </div>
      </div>
  
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Biểu đồ Doanh thu</h3>
          <Bar
            data={{
              labels: revenueData.labels,
              datasets: [
                {
                  label: 'Doanh thu',
                  data: revenueData.data,
                  backgroundColor: 'rgba(53, 162, 235, 0.5)',
                }
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
                title: {
                  display: true,
                  text: 'Doanh thu theo tháng'
                },
              },
            }}
          />
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Biểu đồ Trạng thái Booking</h3>
          <Doughnut
            data={{
              labels: bookingStatus.labels,
              datasets: [
                {
                  label: 'Số lượng booking',
                  data: bookingStatus.data,
                  backgroundColor: [
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(255, 99, 132, 0.8)',
                  ],
                  borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(255, 99, 132, 1)',
                  ],
                  borderWidth: 1
                }
              ]
            }}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
                title: {
                  display: true,
                  text: 'Trạng thái các đơn đặt lịch'
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}