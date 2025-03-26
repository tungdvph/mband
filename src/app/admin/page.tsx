'use client';
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
  ArcElement,     // Thêm ArcElement cho Doughnut chart
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement      // Đăng ký ArcElement
);

export default function AdminDashboard() {
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
    // Fetch thống kê tổng quan
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    // Fetch dữ liệu doanh thu
    const fetchRevenue = async () => {
      try {
        const response = await fetch('/api/stats/revenue');
        const data = await response.json();
        setRevenueData({
          labels: data.map((item: any) => item.month),
          data: data.map((item: any) => item.revenue)
        });
      } catch (error) {
        console.error('Error fetching revenue:', error);
      }
    };

    // Fetch trạng thái booking
    const fetchBookingStatus = async () => {
      try {
        const response = await fetch('/api/stats/booking-status');
        const data = await response.json();
        setBookingStatus({
          labels: ['Đã xác nhận', 'Chờ xác nhận', 'Đã hủy'],
          data: [data.confirmed, data.pending, data.cancelled]
        });
      } catch (error) {
        console.error('Error fetching booking status:', error);
      }
    };

    fetchStats();
    fetchRevenue();
    fetchBookingStatus();
  }, []);

  return (
    <div>
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