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
    ticketBookings: 0, // Đổi tên để rõ ràng đây là tổng TicketBooking
    songs: 0,
  });

  const [revenueData, setRevenueData] = useState<{ labels: string[]; data: number[] }>({
    labels: [],
    data: []
  });

  // Cập nhật state cho bookingStatus để bao gồm 'Đã giao'
  const [bookingStatus, setBookingStatus] = useState({
    labels: ['Đã xác nhận', 'Chờ xác nhận', 'Đã hủy', 'Đã giao'], // Thêm 'Đã giao'
    data: [0, 0, 0, 0] // Thêm một data point cho 'Đã giao'
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
      return;
    }
    if (status === 'authenticated' && (!session?.user || session.user.role !== 'admin')) {
      router.push('/admin/login'); // Hoặc trang thông báo không có quyền
      return;
    }
  }, [status, router, session]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      const fetchData = async () => {
        try {
          console.log('[Client] Bắt đầu gọi fetchData cho Admin Dashboard...');

          // API /api/stats/booking-status đã được cập nhật để trả về 4 trạng thái
          const [statsRes, revenueRes, bookingStatusRes] = await Promise.all([
            fetch('/api/stats'), // API này nên trả về tổng số TicketBookings (ví dụ: ticketBookingCount)
            fetch('/api/stats/revenue'), // API này lấy doanh thu từ đơn 'delivered' của TicketBooking
            fetch('/api/stats/booking-status') // API này trả về { confirmed, pending, cancelled, delivered }
          ]);

          if (!statsRes.ok || !revenueRes.ok || !bookingStatusRes.ok) {
            const statsError = !statsRes.ok ? `Stats API: ${statsRes.status}` : '';
            const revenueError = !revenueRes.ok ? `Revenue API: ${revenueRes.status}` : '';
            const bookingStatusError = !bookingStatusRes.ok ? `Booking Status API: ${bookingStatusRes.status}` : '';
            console.error('[Client] Fetch thất bại!', statsError, revenueError, bookingStatusError);
            throw new Error('Failed to fetch dashboard data. Check console for details.');
          }

          const statsData = await statsRes.json();
          const revenueDataJson = await revenueRes.json();
          const bookingStatusData = await bookingStatusRes.json(); // Dữ liệu sẽ có dạng { confirmed, pending, cancelled, delivered }

          console.log('[Client] Dữ liệu stats:', statsData);
          console.log('[Client] Dữ liệu revenue:', revenueDataJson);
          console.log('[Client] Dữ liệu booking status:', bookingStatusData);

          // Cập nhật stats. Giả sử /api/stats trả về 'ticketBookingCount' hoặc tương tự
          setStats({
            users: statsData.users ?? 0,
            // Ưu tiên trường cụ thể cho TicketBookings nếu API /api/stats cung cấp
            ticketBookings: statsData.ticketBookingCount ?? statsData.ticketBookings ?? statsData.bookings ?? 0,
            songs: statsData.songs ?? 0,
          });

          // Xử lý dữ liệu doanh thu
          const allMonths = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
          let processedRevenueData = Array(12).fill(0);
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
            console.error("[Client] Dữ liệu doanh thu không phải là mảng:", revenueDataJson);
          }
          setRevenueData({
            labels: allMonths,
            data: processedRevenueData
          });

          // Cập nhật dữ liệu cho biểu đồ trạng thái đơn đặt vé (4 trạng thái)
          const bookingStatusChartData = [
            bookingStatusData?.confirmed ?? 0,
            bookingStatusData?.pending ?? 0,
            bookingStatusData?.cancelled ?? 0,
            bookingStatusData?.delivered ?? 0 // Thêm dữ liệu cho 'delivered'
          ];
          console.log('[Client] Dữ liệu cho biểu đồ trạng thái (4 trạng thái):', bookingStatusChartData);
          setBookingStatus(prevState => ({
            ...prevState, // labels đã được cập nhật ở state khởi tạo
            data: bookingStatusChartData
          }));

          console.log('[Client] Hoàn thành fetchData thành công.');

        } catch (error) {
          console.error('[Client] Lỗi trong quá trình fetchData:', error);
          // Reset state với cấu trúc 4 trạng thái
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
  }, [status, session]); // Bỏ router vì đã xử lý ở useEffect trên

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen text-xl">Đang tải...</div>;
  }
  if (status !== 'authenticated' || !session?.user || session.user.role !== 'admin') {
    return <div className="flex items-center justify-center min-h-screen text-xl">Không có quyền truy cập hoặc đang chuyển hướng...</div>;
  }

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen">
      <div className="mb-8 bg-white shadow-md rounded-lg p-4 sm:p-6 border border-slate-200">
        <h2 className="text-xl font-semibold mb-3 text-slate-700">Thông tin tài khoản Admin</h2>
        <p className="text-slate-600"><span className="font-medium">Tên đăng nhập:</span> {session.user.username}</p>
        <p className="text-slate-600"><span className="font-medium">Họ tên:</span> {session.user.fullName}</p>
        <p className="text-slate-600"><span className="font-medium">Email:</span> {session.user.email}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link href="/admin/user" legacyBehavior>
          <a className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg block hover:shadow-xl hover:from-blue-600 hover:to-blue-700 transition duration-300 transform hover:-translate-y-1">
            <h3 className="text-2xl font-bold mb-2">Tổng số Users</h3>
            <p className="text-4xl font-extrabold">{stats.users}</p>
            <p className="mt-2 text-sm opacity-80 hover:opacity-100 underline">Quản lý Users &rarr;</p>
          </a>
        </Link>

        {/* Link này nên trỏ đến trang quản lý TicketBooking */}
        <Link href="/admin/ticket-booking" legacyBehavior>
          <a className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6 rounded-lg shadow-lg block hover:shadow-xl hover:from-yellow-600 hover:to-orange-600 transition duration-300 transform hover:-translate-y-1">
            <h3 className="text-2xl font-bold mb-2">Tổng số Đơn Đặt Vé</h3>
            <p className="text-4xl font-extrabold">{stats.ticketBookings}</p> {/* Hiển thị tổng TicketBooking */}
            <p className="mt-2 text-sm opacity-80 hover:opacity-100 underline">Quản lý Đơn Đặt Vé &rarr;</p>
          </a>
        </Link>

        <Link href="/admin/music" legacyBehavior>
          <a className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-lg shadow-lg block hover:shadow-xl hover:from-green-600 hover:to-emerald-700 transition duration-300 transform hover:-translate-y-1">
            <h3 className="text-2xl font-bold mb-2">Tổng số Bài hát</h3>
            <p className="text-4xl font-extrabold">{stats.songs}</p>
            <p className="mt-2 text-sm opacity-80 hover:opacity-100 underline">Quản lý Âm nhạc &rarr;</p>
          </a>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
          <h3 className="text-xl font-semibold mb-4 text-slate-700">Biểu đồ Doanh thu (Đơn đã giao)</h3>
          {revenueData.labels.length > 0 && revenueData.data.some(d => d > 0) ? (
            <Bar
              data={{
                labels: revenueData.labels,
                datasets: [{
                  label: 'Doanh thu (VND)',
                  data: revenueData.data,
                  backgroundColor: 'rgba(54, 162, 235, 0.6)',
                  borderColor: 'rgba(54, 162, 235, 1)',
                  borderWidth: 1,
                  borderRadius: 4,
                }],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'top' as const },
                  title: { display: true, text: 'Doanh thu hàng tháng (Chỉ tính đơn đã giao)', font: { size: 16 } }
                }
              }}
            />
          ) : (
            <p className="text-center text-gray-500 py-10">Không có dữ liệu doanh thu để hiển thị.</p>
          )}
        </div>

        {/* Cập nhật biểu đồ Trạng thái Đơn Đặt Vé (4 trạng thái) */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
          <h3 className="text-xl font-semibold mb-4 text-slate-700">Trạng thái Đơn Đặt Vé</h3>
          {bookingStatus.data.some(d => d > 0) ? (
            <Doughnut
              data={{
                labels: bookingStatus.labels, // Sẽ là ['Đã xác nhận', 'Chờ xác nhận', 'Đã hủy', 'Đã giao']
                datasets: [
                  {
                    label: 'Số lượng đơn',
                    data: bookingStatus.data, // Mảng 4 phần tử
                    backgroundColor: [
                      'rgba(75, 192, 192, 0.8)',  // Confirmed (Xanh lá cây)
                      'rgba(255, 206, 86, 0.8)', // Pending (Vàng)
                      'rgba(255, 99, 132, 0.8)',  // Cancelled (Đỏ)
                      'rgba(54, 162, 235, 0.8)'   // Delivered (Xanh dương) - MÀU MỚI
                    ],
                    borderColor: [
                      'rgba(75, 192, 192, 1)',
                      'rgba(255, 206, 86, 1)',
                      'rgba(255, 99, 132, 1)',
                      'rgba(54, 162, 235, 1)'    // MÀU VIỀN MỚI
                    ],
                    borderWidth: 1,
                    hoverOffset: 4
                  }
                ]
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'top' as const },
                  title: {
                    display: true,
                    text: 'Phân bố trạng thái đơn đặt vé', // Cập nhật title nếu cần
                    font: { size: 16 }
                  },
                  tooltip: {
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
          ) : (
            <p className="text-center text-gray-500 py-10">Không có dữ liệu trạng thái đặt vé.</p>
          )}
        </div>
      </div>
    </div>
  );
}