// app/admin/dashboard/page.tsx
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
import Link from 'next/link';

// Đăng ký các thành phần của ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Component chính cho trang dashboard admin
export default function AdminDashboardPage() {
  // Sử dụng hook useSession để lấy thông tin session và trạng thái xác thực
  const { data: session, status } = useSession();
  const router = useRouter(); // Hook để điều hướng

  // State để lưu trữ các số liệu thống kê tổng quan
  const [stats, setStats] = useState({
    users: 0,
    ticketBookings: 0, // Tổng số lượt đặt vé
    songs: 0,
  });

  // State để lưu trữ dữ liệu doanh thu cho biểu đồ cột
  const [revenueData, setRevenueData] = useState<{ labels: string[]; data: number[] }>({
    labels: [],
    data: []
  });

  // State để lưu trữ dữ liệu trạng thái đặt vé cho biểu đồ tròn
  const [bookingStatus, setBookingStatus] = useState({
    labels: ['Đã xác nhận', 'Chờ xác nhận', 'Đã hủy', 'Đã giao'], // Các nhãn trạng thái
    data: [0, 0, 0, 0] // Dữ liệu tương ứng với các nhãn
  });

  // useEffect để kiểm tra xác thực và quyền admin
  useEffect(() => {
    // Nếu chưa xác thực (và không phải đang tải), chuyển hướng đến trang login
    if (status === 'unauthenticated') {
      console.log('[AdminDashboardPage] Chưa xác thực, đang chuyển hướng đến /admin/login...');
      router.push('/admin/login');
      return;
    }
    // Nếu đã xác thực nhưng không có thông tin user hoặc user không phải admin, chuyển hướng
    if (status === 'authenticated' && (!session?.user || session.user.role !== 'admin')) {
      console.log('[AdminDashboardPage] Đã xác thực nhưng không phải admin, đang chuyển hướng...');
      // Có thể chuyển hướng đến trang thông báo không có quyền hoặc trang login
      router.push('/admin/login');
      return;
    }
  }, [status, router, session]); // Phụ thuộc vào status, router, và session

  // useEffect để fetch dữ liệu cho dashboard khi đã xác thực và là admin
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      const fetchData = async () => {
        console.log('[AdminDashboardPage] Bắt đầu fetch dữ liệu cho dashboard...');
        try {
          // Gọi đồng thời các API để lấy dữ liệu
          const [statsRes, revenueRes, bookingStatusRes] = await Promise.all([
            fetch('/api/stats'), // API lấy số liệu thống kê chung
            fetch('/api/stats/revenue'), // API lấy dữ liệu doanh thu
            fetch('/api/stats/booking-status') // API lấy dữ liệu trạng thái đặt vé
          ]);

          // Kiểm tra nếu có lỗi khi gọi API
          if (!statsRes.ok || !revenueRes.ok || !bookingStatusRes.ok) {
            const errors = [];
            if (!statsRes.ok) errors.push(`API Stats: ${statsRes.status} - ${await statsRes.text()}`);
            if (!revenueRes.ok) errors.push(`API Revenue: ${revenueRes.status} - ${await revenueRes.text()}`);
            if (!bookingStatusRes.ok) errors.push(`API Booking Status: ${bookingStatusRes.status} - ${await bookingStatusRes.text()}`);
            console.error('[AdminDashboardPage] Lỗi khi fetch dữ liệu:', errors.join('; '));
            throw new Error('Không thể tải dữ liệu cho dashboard. Vui lòng kiểm tra console.');
          }

          // Parse dữ liệu JSON từ response
          const statsData = await statsRes.json();
          const revenueDataJson = await revenueRes.json();
          const bookingStatusData = await bookingStatusRes.json();

          console.log('[AdminDashboardPage] Dữ liệu Stats:', statsData);
          console.log('[AdminDashboardPage] Dữ liệu Revenue:', revenueDataJson);
          console.log('[AdminDashboardPage] Dữ liệu Booking Status:', bookingStatusData);

          // Cập nhật state cho các số liệu thống kê
          setStats({
            users: statsData.users ?? 0,
            ticketBookings: statsData.ticketBookingCount ?? statsData.ticketBookings ?? statsData.bookings ?? 0,
            songs: statsData.songs ?? 0,
          });

          // Xử lý và cập nhật state cho dữ liệu doanh thu
          const allMonths = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
          let processedRevenueData = Array(12).fill(0); // Khởi tạo mảng 12 tháng với giá trị 0

          if (Array.isArray(revenueDataJson)) {
            const revenueMap = new Map<string, number>();
            revenueDataJson.forEach((item: { month: string; revenue: number }) => {
              if (item && typeof item.month === 'string' && typeof item.revenue === 'number') {
                revenueMap.set(item.month, item.revenue);
              }
            });
            allMonths.forEach((month, index) => {
              if (revenueMap.has(month)) {
                processedRevenueData[index] = revenueMap.get(month) || 0;
              }
            });
          } else {
            console.error("[AdminDashboardPage] Dữ liệu doanh thu không phải là một mảng:", revenueDataJson);
          }
          setRevenueData({
            labels: allMonths,
            data: processedRevenueData
          });

          // Cập nhật state cho dữ liệu trạng thái đặt vé
          const bookingStatusChartData = [
            bookingStatusData?.confirmed ?? 0,
            bookingStatusData?.pending ?? 0,
            bookingStatusData?.cancelled ?? 0,
            bookingStatusData?.delivered ?? 0 // Thêm dữ liệu cho trạng thái 'delivered'
          ];
          console.log('[AdminDashboardPage] Dữ liệu cho biểu đồ trạng thái (4 trạng thái):', bookingStatusChartData);
          setBookingStatus(prevState => ({
            ...prevState, // Giữ nguyên labels đã được khởi tạo
            data: bookingStatusChartData
          }));

          console.log('[AdminDashboardPage] Fetch và cập nhật dữ liệu thành công.');

        } catch (error) {
          console.error('[AdminDashboardPage] Lỗi trong quá trình fetchData:', error);
          // Reset state về giá trị mặc định nếu có lỗi
          setStats({ users: 0, ticketBookings: 0, songs: 0 });
          setRevenueData({ labels: [], data: [] });
          setBookingStatus({
            labels: ['Đã xác nhận', 'Chờ xác nhận', 'Đã hủy', 'Đã giao'],
            data: [0, 0, 0, 0]
          });
        }
      };
      fetchData();
    }
  }, [status, session]); // Phụ thuộc vào status và session để fetch lại khi cần

  // Hiển thị thông báo đang tải nếu trạng thái là 'loading'
  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen text-xl text-slate-700">Đang tải thông tin phiên...</div>;
  }

  // Nếu chưa xác thực hoặc không phải admin (và không phải đang loading),
  // hiển thị thông báo (useEffect sẽ xử lý chuyển hướng)
  if (status !== 'authenticated' || !session?.user || session.user.role !== 'admin') {
    return <div className="flex items-center justify-center min-h-screen text-xl text-red-600">Không có quyền truy cập hoặc đang chuyển hướng đến trang đăng nhập...</div>;
  }

  // Render nội dung dashboard khi đã xác thực và là admin
  return (
    <div className="p-4 sm:p-6 bg-slate-100 min-h-screen">
      {/* Phần thông tin tài khoản Admin */}
      <div className="mb-8 bg-white shadow-lg rounded-lg p-4 sm:p-6 border border-slate-200">
        <h2 className="text-2xl font-semibold mb-4 text-slate-800">Thông tin tài khoản Admin</h2>
        <p className="text-slate-700"><span className="font-medium text-slate-600">Tên đăng nhập:</span> {session.user.username}</p>
        <p className="text-slate-700"><span className="font-medium text-slate-600">Họ tên:</span> {session.user.fullName}</p>
        <p className="text-slate-700"><span className="font-medium text-slate-600">Email:</span> {session.user.email}</p>
      </div>

      {/* Phần các thẻ thống kê nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link href="/admin/user" legacyBehavior>
          <a className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6 rounded-xl shadow-xl block hover:shadow-2xl hover:from-blue-600 hover:to-indigo-700 transition duration-300 transform hover:-translate-y-1">
            <h3 className="text-2xl font-bold mb-2">Tổng số Users</h3>
            <p className="text-5xl font-extrabold">{stats.users}</p>
            <p className="mt-3 text-sm opacity-90 hover:opacity-100 underline">Quản lý Users &rarr;</p>
          </a>
        </Link>

        <Link href="/admin/ticket-booking" legacyBehavior>
          <a className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-6 rounded-xl shadow-xl block hover:shadow-2xl hover:from-amber-600 hover:to-orange-700 transition duration-300 transform hover:-translate-y-1">
            <h3 className="text-2xl font-bold mb-2">Tổng số Đơn Đặt Vé</h3>
            <p className="text-5xl font-extrabold">{stats.ticketBookings}</p>
            <p className="mt-3 text-sm opacity-90 hover:opacity-100 underline">Quản lý Đơn Đặt Vé &rarr;</p>
          </a>
        </Link>

        <Link href="/admin/music" legacyBehavior>
          <a className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 rounded-xl shadow-xl block hover:shadow-2xl hover:from-green-600 hover:to-emerald-700 transition duration-300 transform hover:-translate-y-1">
            <h3 className="text-2xl font-bold mb-2">Tổng số Bài hát</h3>
            <p className="text-5xl font-extrabold">{stats.songs}</p>
            <p className="mt-3 text-sm opacity-90 hover:opacity-100 underline">Quản lý Âm nhạc &rarr;</p>
          </a>
        </Link>
      </div>

      {/* Phần biểu đồ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Biểu đồ Doanh thu */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-slate-200 min-h-[400px] flex flex-col">
          <h3 className="text-xl font-semibold mb-4 text-slate-700">Biểu đồ Doanh thu (Đơn đã giao)</h3>
          {revenueData.labels.length > 0 && revenueData.data.some(d => d > 0) ? (
            <div className="relative flex-grow"> {/* Container cho biểu đồ để co giãn */}
              <Bar
                data={{
                  labels: revenueData.labels,
                  datasets: [{
                    label: 'Doanh thu (VND)',
                    data: revenueData.data,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    borderRadius: 5,
                    hoverBackgroundColor: 'rgba(54, 162, 235, 0.9)',
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false, // Cho phép biểu đồ co giãn theo container
                  plugins: {
                    legend: { position: 'top' as const, labels: { color: '#475569', font: { size: 14 } } },
                    title: { display: true, text: 'Doanh thu hàng tháng (Chỉ tính đơn đã giao)', font: { size: 18, weight: 'bold' }, color: '#334155', padding: { bottom: 20 } },
                    tooltip: {
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      titleFont: { size: 14 },
                      bodyFont: { size: 12 },
                      callbacks: {
                        label: function (context) {
                          return `${context.dataset.label}: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(context.parsed.y)}`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        color: '#475569',
                        callback: function (value) {
                          return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(Number(value));
                        }
                      },
                      grid: { color: '#e2e8f0' }
                    },
                    x: {
                      ticks: { color: '#475569', font: { size: 12 } },
                      grid: { display: false }
                    }
                  }
                }}
              />
            </div>
          ) : (
            <p className="text-center text-gray-500 py-10 flex-grow flex items-center justify-center">Không có dữ liệu doanh thu để hiển thị.</p>
          )}
        </div>

        {/* Biểu đồ Trạng thái Đơn Đặt Vé */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-slate-200 min-h-[400px] flex flex-col">
          <h3 className="text-xl font-semibold mb-4 text-slate-700">Trạng thái Đơn Đặt Vé</h3>
          {bookingStatus.data.some(d => d > 0) ? (
            <div className="relative flex-grow"> {/* Container cho biểu đồ để co giãn */}
              <Doughnut
                data={{
                  labels: bookingStatus.labels,
                  datasets: [
                    {
                      label: 'Số lượng đơn',
                      data: bookingStatus.data,
                      backgroundColor: [
                        'rgba(75, 192, 192, 0.8)',  // Đã xác nhận (Xanh lá)
                        'rgba(255, 206, 86, 0.8)', // Chờ xác nhận (Vàng)
                        'rgba(255, 99, 132, 0.8)',  // Đã hủy (Đỏ)
                        'rgba(54, 162, 235, 0.8)'   // Đã giao (Xanh dương)
                      ],
                      borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)'
                      ],
                      borderWidth: 1,
                      hoverOffset: 8,
                      hoverBorderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)'
                      ],
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false, // Cho phép biểu đồ co giãn theo container
                  plugins: {
                    legend: { position: 'top' as const, labels: { color: '#475569', font: { size: 14 }, padding: 20 } },
                    title: {
                      display: true,
                      text: 'Phân bố trạng thái đơn đặt vé',
                      font: { size: 18, weight: 'bold' },
                      color: '#334155',
                      padding: { bottom: 20 }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      titleFont: { size: 14 },
                      bodyFont: { size: 12 },
                      callbacks: {
                        label: function (context) {
                          let label = context.label || '';
                          if (label) {
                            label += ': ';
                          }
                          if (context.parsed !== null) {
                            label += context.parsed;
                            const total = context.dataset.data.reduce((acc: number, val: number) => acc + val, 0);
                            if (total > 0) {
                              const percentage = ((context.parsed / total) * 100).toFixed(1) + '%';
                              label += ` (${percentage})`;
                            }
                          }
                          return label;
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          ) : (
            <p className="text-center text-gray-500 py-10 flex-grow flex items-center justify-center">Không có dữ liệu trạng thái đặt vé để hiển thị.</p>
          )}
        </div>
      </div>
    </div>
  );
}
