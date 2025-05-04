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
import Link from 'next/link'; // Import Link component

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

  const [revenueData, setRevenueData] = useState<{ labels: string[]; data: number[] }>({
    labels: [],
    data: []
  });

  const [bookingStatus, setBookingStatus] = useState({
    labels: ['Đã xác nhận', 'Chờ xác nhận', 'Đã hủy'],
    data: [0, 0, 0]
  });

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/admin/login');
      return;
    }

    // Redirect if authenticated but not an admin
    if (status === 'authenticated' && (!session?.user || session.user.role !== 'admin')) {
      router.push('/admin/login'); // Or redirect to a "forbidden" page or home page
      return;
    }
  }, [status, router, session]);

  useEffect(() => {
    // Fetch data only if authenticated as admin
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      const fetchData = async () => {
        try {
          // <-- THÊM LOG Ở ĐÂY (Bắt đầu fetch) -->
          console.log('[Client] Bắt đầu gọi fetchData...');

          const [statsRes, revenueRes, bookingRes] = await Promise.all([
            fetch('/api/stats'),
            fetch('/api/stats/revenue'),
            fetch('/api/stats/booking-status')
          ]);

          // <-- THÊM LOG Ở ĐÂY (Sau khi nhận response, trước khi check .ok) -->
          console.log('[Client] Đã nhận responses. Status của statsRes:', statsRes.status);
          console.log('[Client] Status của revenueRes:', revenueRes.status);
          console.log('[Client] Status của bookingRes:', bookingRes.status);


          // Check if responses are ok before parsing JSON
          if (!statsRes.ok || !revenueRes.ok || !bookingRes.ok) {
            // <-- THÊM LOG Ở ĐÂY (Khi có lỗi fetch) -->
            console.error('[Client] Fetch thất bại! Stats OK:', statsRes.ok, 'Revenue OK:', revenueRes.ok, 'Booking OK:', bookingRes.ok);
            throw new Error('Failed to fetch dashboard data');
          }

          // Parse JSON
          const statsData = await statsRes.json();
          // <-- THÊM LOG Ở ĐÂY (Sau khi parse statsData) - QUAN TRỌNG -->
          console.log('[Client] Dữ liệu stats đã parse:', statsData);

          const revenueDataJson = await revenueRes.json();
          // <-- THÊM LOG Ở ĐÂY (Sau khi parse revenueDataJson) -->
          console.log('[Client] Dữ liệu revenue đã parse:', revenueDataJson);

          const bookingData = await bookingRes.json();
          // <-- THÊM LOG Ở ĐÂY (Sau khi parse bookingData) -->
          console.log('[Client] Dữ liệu booking status đã parse:', bookingData);


          // --- BẮT ĐẦU XỬ LÝ STATS ---
          // <-- THÊM LOG Ở ĐÂY (Trước khi gọi setStats) - QUAN TRỌNG -->
          console.log('[Client] Chuẩn bị gọi setStats với dữ liệu:', statsData);
          setStats(statsData); // Cập nhật state stats
          // --- KẾT THÚC XỬ LÝ STATS ---


          // --- BẮT ĐẦU SỬA ĐỔI XỬ LÝ DOANH THU ---
          const allMonths = [
            'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
            'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
          ];
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
            console.error("[Client] Dữ liệu doanh thu trả về không phải là mảng:", revenueDataJson);
          }

          // <-- THÊM LOG Ở ĐÂY (Trước khi gọi setRevenueData) -->
          console.log('[Client] Chuẩn bị gọi setRevenueData với labels:', allMonths, 'và data:', processedRevenueData);
          setRevenueData({
            labels: allMonths,
            data: processedRevenueData
          });
          // --- KẾT THÚC SỬA ĐỔI XỬ LÝ DOANH THU ---


          // --- BẮT ĐẦU XỬ LÝ BOOKING STATUS ---
          // <-- THÊM LOG Ở ĐÂY (Trước khi gọi setBookingStatus) -->
          const bookingStatusUpdateData = [
            bookingData?.confirmed ?? 0,
            bookingData?.pending ?? 0,
            bookingData?.cancelled ?? 0
          ];
          console.log('[Client] Chuẩn bị gọi setBookingStatus với dữ liệu:', bookingStatusUpdateData);
          setBookingStatus({
            labels: ['Đã xác nhận', 'Chờ xác nhận', 'Đã hủy'],
            data: bookingStatusUpdateData
          });
          // --- KẾT THÚC XỬ LÝ BOOKING STATUS ---

          // <-- THÊM LOG Ở ĐÂY (Khi fetch thành công) -->
          console.log('[Client] Hoàn thành fetchData thành công.');

        } catch (error) {
          // <-- THÊM LOG Ở ĐÂY (Khi có lỗi trong khối try...catch) -->
          console.error('[Client] Lỗi trong quá trình fetchData:', error);

          // Reset các state về trạng thái rỗng/mặc định khi có lỗi
          setStats({ users: 0, bookings: 0, songs: 0, contacts: 0 });
          setRevenueData({ labels: [], data: [] });
          setBookingStatus({ labels: ['Đã xác nhận', 'Chờ xác nhận', 'Đã hủy'], data: [0, 0, 0] });
        }
      };

      fetchData();
    }
  }, [status, session]); // Dependencies for data fetching effect

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Đang tải...</div>
      </div>
    );
  }

  // Render null or a message if authentication check hasn't completed or user is not admin
  // The useEffect above handles redirection, but this prevents rendering the dashboard prematurely
  if (status !== 'authenticated' || !session?.user || session.user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Đang chuyển hướng hoặc không có quyền truy cập...</div>
      </div>
    ); // Or return null if redirection handles everything
  }

  // Render the main dashboard content
  return (
    <div className="p-6">
      {/* <h1 className="text-2xl font-bold mb-4">Bảng điều khiển Admin</h1> */}
      <div className="mb-8">
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Thông tin tài khoản</h2>
          <p>Tên đăng nhập: {session.user.username}</p>
          <p>Họ tên: {session.user.fullName}</p>
          <p>Email: {session.user.email}</p>
        </div>
      </div>

      {/* Stats Boxes with Corrected Links */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Users Box */}
        <Link href="/admin/user" legacyBehavior>
          <a className="bg-blue-500 text-white p-6 rounded-lg block hover:bg-blue-600 transition duration-300">
            <h3 className="text-xl mb-2">Tổng số Users: {stats.users}</h3>
            <p className="underline cursor-pointer">Chi tiết</p>
          </a>
        </Link>

        {/* Bookings Box */}
        <Link href="/admin/booking" legacyBehavior>
          <a className="bg-yellow-500 text-white p-6 rounded-lg block hover:bg-yellow-600 transition duration-300">
            <h3 className="text-xl mb-2">Tổng số Bookings: {stats.bookings}</h3>
            <p className="underline cursor-pointer">Chi tiết</p>
          </a>
        </Link>

        {/* Songs/Music Box */}
        <Link href="/admin/music" legacyBehavior>
          <a className="bg-green-500 text-white p-6 rounded-lg block hover:bg-green-600 transition duration-300">
            <h3 className="text-xl mb-2">Tổng số bài hát: {stats.songs}</h3>
            <p className="underline cursor-pointer">Chi tiết</p>
          </a>
        </Link>

        {/* Contacts Box */}
        <Link href="/admin/contact" legacyBehavior>
          <a className="bg-teal-500 text-white p-6 rounded-lg block hover:bg-teal-600 transition duration-300">
            <h3 className="text-xl mb-2">Tổng số Liên hệ: {stats.contacts}</h3>
            <p className="underline cursor-pointer">Chi tiết</p>
          </a>
        </Link>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Biểu đồ Doanh thu</h3>
          {revenueData.labels.length > 0 ? (
            <Bar
              data={{
                labels: revenueData.labels,
                datasets: [
                  {
                    label: 'Doanh thu (VND)', // Thêm đơn vị nếu cần
                    data: revenueData.data,
                    backgroundColor: 'rgba(53, 162, 235, 0.5)',
                    borderColor: 'rgba(53, 162, 235, 1)',
                    borderWidth: 1,
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
                  tooltip: { // Tùy chỉnh tooltip nếu muốn hiển thị tiền tệ
                    callbacks: {
                      label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                          label += ': ';
                        }
                        if (context.parsed.y !== null) {
                          // Định dạng số thành tiền tệ Việt Nam
                          label += new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(context.parsed.y);
                        }
                        return label;
                      }
                    }
                  }
                },
                scales: { // Thêm trục Y để định dạng số
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function (value) {
                        // Hiển thị giá trị rút gọn trên trục Y nếu cần
                        if (typeof value === 'number') {
                          return new Intl.NumberFormat('vi-VN', { notation: 'compact', compactDisplay: 'short' }).format(value);
                        }
                        return value;
                      }
                    }
                  }
                }
              }}
            />
          ) : (
            <p className="text-center text-gray-500">Đang tải hoặc không có dữ liệu doanh thu...</p>
          )}
        </div>
        {/* Booking Status Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Biểu đồ Trạng thái Booking</h3>
          {bookingStatus.data.some(d => d > 0) ? ( // Kiểm tra nếu có dữ liệu booking tổng lớn hơn 0
            <Doughnut
              data={{
                labels: bookingStatus.labels,
                datasets: [
                  {
                    label: 'Số lượng booking',
                    data: bookingStatus.data,
                    backgroundColor: [
                      'rgba(75, 192, 192, 0.8)',  // Confirmed
                      'rgba(255, 206, 86, 0.8)', // Pending
                      'rgba(255, 99, 132, 0.8)',  // Cancelled
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
                        }
                        // Tính phần trăm
                        const total = context.dataset.data.reduce((acc: number, data: number) => acc + data, 0);
                        const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(2) + '%' : '0%';
                        label += ` (${percentage})`;
                        return label;
                      }
                    }
                  }
                }
              }}
            />
          ) : (
            <p className="text-center text-gray-500">Đang tải hoặc không có dữ liệu trạng thái booking...</p>
          )}
        </div>
      </div>
    </div>
  );
}