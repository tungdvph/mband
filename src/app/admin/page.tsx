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

  // Bỏ 'contacts' khỏi state khởi tạo
  const [stats, setStats] = useState({
    users: 0,
    bookings: 0, // Giả sử đây là tổng booking từ model Booking
    songs: 0,
    // contacts: 0 // <--- BỎ DÒNG NÀY
  });

  const [revenueData, setRevenueData] = useState<{ labels: string[]; data: number[] }>({
    labels: [],
    data: []
  });

  // --- QUAY LẠI STATE VÀ LABELS BAN ĐẦU CHO bookingStatus ---
  const [bookingStatus, setBookingStatus] = useState({
    labels: ['Đã xác nhận', 'Chờ xác nhận', 'Đã hủy'], // Giữ nguyên 3 labels
    data: [0, 0, 0] // Giữ nguyên 3 data points
  });
  // ---------------------------------------------------------

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/admin/login');
      return;
    }
    // Redirect if authenticated but not an admin
    if (status === 'authenticated' && (!session?.user || session.user.role !== 'admin')) {
      router.push('/admin/login');
      return;
    }
  }, [status, router, session]);

  useEffect(() => {
    // Fetch data only if authenticated as admin
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      const fetchData = async () => {
        try {
          console.log('[Client] Bắt đầu gọi fetchData...');

          // --- QUAY LẠI FETCH ENDPOINT BAN ĐẦU CHO bookingRes ---
          const [statsRes, revenueRes, bookingRes] = await Promise.all([
            fetch('/api/stats'), // API này đã được sửa để không trả về contacts
            fetch('/api/stats/revenue'), // API này đã được sửa để lấy theo 'delivered'
            fetch('/api/stats/booking-status') // Giữ nguyên endpoint này
          ]);
          // ----------------------------------------------------

          console.log('[Client] Đã nhận responses. Status của statsRes:', statsRes.status);
          console.log('[Client] Status của revenueRes:', revenueRes.status);
          console.log('[Client] Status của bookingRes:', bookingRes.status); // Kiểm tra lại status này

          // Check if responses are ok before parsing JSON
          // QUAN TRỌNG: Nếu bookingRes vẫn lỗi (false), bạn cần kiểm tra API /api/stats/booking-status
          if (!statsRes.ok || !revenueRes.ok || !bookingRes.ok) {
            console.error('[Client] Fetch thất bại! Stats OK:', statsRes.ok, 'Revenue OK:', revenueRes.ok, 'Booking OK:', bookingRes.ok);
            // Log lỗi chi tiết nếu có thể
            const statsError = !statsRes.ok ? await statsRes.text() : '';
            const revenueError = !revenueRes.ok ? await revenueRes.text() : '';
            const bookingStatusError = !bookingRes.ok ? await bookingRes.text() : '';
            console.error('Error details:', { statsError, revenueError, bookingStatusError });
            throw new Error('Failed to fetch dashboard data');
          }

          // Parse JSON
          const statsData = await statsRes.json(); // Không có 'contacts'
          console.log('[Client] Dữ liệu stats đã parse:', statsData);

          const revenueDataJson = await revenueRes.json();
          console.log('[Client] Dữ liệu revenue đã parse:', revenueDataJson);

          const bookingData = await bookingRes.json(); // Dữ liệu từ /api/stats/booking-status
          console.log('[Client] Dữ liệu booking status đã parse:', bookingData);


          // --- XỬ LÝ STATS ---
          // Cập nhật state stats (không có contacts)
          setStats({
            users: statsData.users ?? 0,
            bookings: statsData.bookings ?? 0,
            songs: statsData.songs ?? 0,
          });

          // --- XỬ LÝ DOANH THU (Đã đúng, dựa trên đơn 'delivered') ---
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
            console.error("[Client] Dữ liệu doanh thu trả về không phải là mảng:", revenueDataJson);
          }
          setRevenueData({
            labels: allMonths,
            data: processedRevenueData
          });

          // --- QUAY LẠI XỬ LÝ BOOKING STATUS BAN ĐẦU (3 trạng thái) ---
          // Giả sử bookingData từ /api/stats/booking-status trả về { confirmed: X, pending: Y, cancelled: Z }
          const bookingStatusUpdateData = [
            bookingData?.confirmed ?? 0,
            bookingData?.pending ?? 0,
            bookingData?.cancelled ?? 0
          ];
          console.log('[Client] Chuẩn bị gọi setBookingStatus với dữ liệu (3 trạng thái):', bookingStatusUpdateData);
          setBookingStatus(prevState => ({ // Giữ lại labels cũ, chỉ cập nhật data
            ...prevState,
            data: bookingStatusUpdateData
          }));
          // -------------------------------------------------------------

          console.log('[Client] Hoàn thành fetchData thành công.');

        } catch (error) {
          console.error('[Client] Lỗi trong quá trình fetchData:', error);
          // Reset state như cũ, nhưng bỏ contacts
          setStats({ users: 0, bookings: 0, songs: 0 });
          setRevenueData({ labels: [], data: [] });
          setBookingStatus({ labels: ['Đã xác nhận', 'Chờ xác nhận', 'Đã hủy'], data: [0, 0, 0] });
        }
      };

      fetchData();
    }
  }, [status, session]);

  // --- PHẦN RENDER ---
  // Phần kiểm tra loading và authentication giữ nguyên

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Đang tải...</div>
      </div>
    );
  }
  if (status !== 'authenticated' || !session?.user || session.user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Đang chuyển hướng hoặc không có quyền truy cập...</div>
      </div>
    );
  }

  return (
    // Sử dụng style đã cải thiện từ lần trước
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen">
      <div className="mb-8">
        <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 border border-slate-200">
          <h2 className="text-xl font-semibold mb-3 text-slate-700">Thông tin tài khoản Admin</h2>
          <p className="text-slate-600"><span className="font-medium">Tên đăng nhập:</span> {session.user.username}</p>
          <p className="text-slate-600"><span className="font-medium">Họ tên:</span> {session.user.fullName}</p>
          <p className="text-slate-600"><span className="font-medium">Email:</span> {session.user.email}</p>
        </div>
      </div>

      {/* Stats Boxes - Bỏ Contact Box và điều chỉnh grid */}
      {/* Sử dụng grid-cols-3 và gap-6 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Users Box (Style đã cải thiện) */}
        <Link href="/admin/user" legacyBehavior>
          <a className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg block hover:shadow-xl hover:from-blue-600 hover:to-blue-700 transition duration-300 transform hover:-translate-y-1">
            <h3 className="text-2xl font-bold mb-2">Tổng số Users</h3>
            <p className="text-4xl font-extrabold">{stats.users}</p>
            <p className="mt-2 text-sm opacity-80 hover:opacity-100 underline">Quản lý Users &rarr;</p>
          </a>
        </Link>

        {/* Bookings Box (Style đã cải thiện) */}
        <Link href="/admin/booking" legacyBehavior>
          <a className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6 rounded-lg shadow-lg block hover:shadow-xl hover:from-yellow-600 hover:to-orange-600 transition duration-300 transform hover:-translate-y-1">
            <h3 className="text-2xl font-bold mb-2">Tổng số Đặt lịch</h3>
            <p className="text-4xl font-extrabold">{stats.bookings}</p>
            <p className="mt-2 text-sm opacity-80 hover:opacity-100 underline">Quản lý Đặt lịch &rarr;</p>
          </a>
        </Link>

        {/* Songs/Music Box (Style đã cải thiện) */}
        <Link href="/admin/music" legacyBehavior>
          <a className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-lg shadow-lg block hover:shadow-xl hover:from-green-600 hover:to-emerald-700 transition duration-300 transform hover:-translate-y-1">
            <h3 className="text-2xl font-bold mb-2">Tổng số Bài hát</h3>
            <p className="text-4xl font-extrabold">{stats.songs}</p>
            <p className="mt-2 text-sm opacity-80 hover:opacity-100 underline">Quản lý Âm nhạc &rarr;</p>
          </a>
        </Link>

        {/* --- KHỐI CONTACTS BOX ĐÃ BỊ XÓA --- */}

      </div>

      {/* Charts Section */}
      {/* Giữ nguyên style và grid cho charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Revenue Chart (Đã đúng, lấy theo đơn 'delivered') */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
          <h3 className="text-xl font-semibold mb-4 text-slate-700">Biểu đồ Doanh thu (Đơn đã giao)</h3>
          {revenueData.labels.length > 0 && revenueData.data.some(d => d > 0) ? (
            <Bar
              data={{
                labels: revenueData.labels,
                datasets: [{
                  label: 'Doanh thu (VND)',
                  data: revenueData.data, // Thuộc tính 'data' bị thiếu đã được thêm lại
                  backgroundColor: 'rgba(54, 162, 235, 0.6)',
                  borderColor: 'rgba(54, 162, 235, 1)',
                  borderWidth: 1,
                  borderRadius: 4,
                }],
              }}
              options={{ /* ... options ... */ }}
            />
          ) : (
            <p className="text-center text-gray-500 py-10">Không có dữ liệu doanh thu để hiển thị.</p>
          )}
        </div>

        {/* Booking Status Chart (Quay về hiển thị 3 trạng thái ban đầu) */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
          <h3 className="text-xl font-semibold mb-4 text-slate-700">Trạng thái Đơn Đặt Lịch/Vé</h3> {/* Sửa title cho phù hợp */}
          {/* Sử dụng state bookingStatus (3 phần tử) */}
          {bookingStatus.data.some(d => d > 0) ? (
            <Doughnut
              data={{
                labels: bookingStatus.labels, // ['Đã xác nhận', 'Chờ xác nhận', 'Đã hủy']
                datasets: [
                  {
                    label: 'Số lượng đơn',
                    data: bookingStatus.data, // Mảng 3 phần tử
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
                    borderWidth: 1,
                    hoverOffset: 4
                  }
                ]
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'top' as const },
                  title: { display: true, text: 'Phân bố trạng thái đơn (3 trạng thái)', font: { size: 16 } }, // Cập nhật title
                  tooltip: { /* ... callbacks tính % ... */ }
                }
              }}
            />
          ) : (
            <p className="text-center text-gray-500 py-10">Không có dữ liệu trạng thái đặt lịch/vé.</p> // Cập nhật text
          )}
        </div>
      </div>
    </div>
  );
}