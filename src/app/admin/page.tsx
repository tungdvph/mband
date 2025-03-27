'use client';
// Xóa dòng import AdminHeader
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
  
  // Khai báo state trước khi sử dụng useEffect
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
    }
  }, [status, router]);

  // Các useEffect khác
  useEffect(() => {
    if (status === 'authenticated') {
      // Fetch data chỉ khi đã xác thực
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
  }, [status]);

  if (status === 'loading') {
    return <div>Đang tải...</div>;
  }

  if (!session?.user || session.user.role !== 'admin') {
    return null;
  }

  return (
    // Xóa AdminHeader và thẻ fragment
    <div className="p-6">
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