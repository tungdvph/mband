'use client';

import { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Layout from '@/components/layout/Layout'; // Đảm bảo đường dẫn Layout đúng
import { useCart } from '@/contexts/CartContext';
import { Schedule } from '@/types/schedule';
import { toast } from 'react-toastify';
import {
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaSearch,
  FaSortAmountDown,
  FaSortAmountUp,
  FaDollarSign,
  FaShoppingCart
} from 'react-icons/fa';

// Hàm format ngày giờ
const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn("Chuỗi ngày không hợp lệ được truyền cho formatDate:", dateString);
      return 'Ngày không hợp lệ';
    }
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch (e) {
    console.error("Lỗi khi định dạng ngày:", dateString, e);
    return 'Lỗi định dạng ngày';
  }
}

// Hàm format giá vé
const formatPrice = (price: number | undefined | null): string => {
  if (price === undefined || price === null) {
    return 'Chưa có giá';
  }
  if (price === 0) {
    return 'Miễn phí';
  }
  return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
};

// Type cho các tùy chọn sắp xếp
type SortOption = 'date_desc' | 'date_asc' | 'price_asc' | 'price_desc';

export default function ScheduleListPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('date_desc');

  const { data: session, status } = useSession();
  const router = useRouter();
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchSchedules = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/schedule');
        if (!response.ok) {
          throw new Error(`Không thể tải lịch trình (${response.status})`);
        }
        const data: Schedule[] = await response.json();
        setSchedules(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định';
        setError(errorMessage);
        console.error("Lỗi khi fetch lịch trình:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedules();
  }, []);

  const displayedSchedules = useMemo(() => {
    let filtered = schedules;

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(schedule =>
        schedule.eventName.toLowerCase().includes(lowerCaseSearchTerm) ||
        schedule.venue.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        (schedule.venue.city && schedule.venue.city.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }

    const sorted = [...filtered];
    switch (sortOption) {
      case 'date_desc':
        sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'date_asc':
        sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'price_asc':
        sorted.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity)); // Xử lý giá null/undefined khi sắp xếp
        break;
      case 'price_desc':
        sorted.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity)); // Xử lý giá null/undefined khi sắp xếp
        break;
      default:
        sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
    }
    return sorted;
  }, [schedules, searchTerm, sortOption]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSortChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSortOption(event.target.value as SortOption);
  };

  const handleAddToCart = (schedule: Schedule) => {
    if (status === 'loading') {
      toast.info("Đang kiểm tra trạng thái đăng nhập...");
      return;
    }
    if (status !== 'authenticated') {
      setShowLoginPrompt(true);
      return;
    }
    addToCart(schedule);
  };

  const handleViewDetailsClick = (scheduleId: string) => {
    if (status === 'loading') return;
    if (status !== 'authenticated') {
      setShowLoginPrompt(true);
      return;
    }
    router.push(`/schedule/${scheduleId}`);
  };

  const closeLoginPrompt = () => setShowLoginPrompt(false);
  const handleGoLogin = () => { router.push('/login'); closeLoginPrompt(); };

  const getScheduleStatusDisplay = (scheduleStatus?: string) => {
    if (!scheduleStatus || scheduleStatus === 'scheduled') {
      return null;
    }
    switch (scheduleStatus) {
      case 'cancelled':
        return { text: 'Đã hủy', className: 'bg-red-100 text-red-800' };
      case 'postponed':
        return { text: 'Tạm hoãn', className: 'bg-yellow-100 text-yellow-800' };
      case 'completed':
        return { text: 'Đã hoàn thành', className: 'bg-green-100 text-green-800' }; // Thêm trạng thái completed
      default:
        return { text: scheduleStatus, className: 'bg-gray-100 text-gray-800' }; // Mặc định
    }
  };

  return (
    <Layout>
      <div className="bg-gradient-to-b from-gray-100 to-gray-200 py-16 min-h-screen">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-12 text-center text-gray-800 tracking-tight">
            Lịch Trình Sự Kiện
          </h1>

          {/* Phần Tìm kiếm và Sắp xếp */}
          <div className="mb-10 p-4 bg-white rounded-lg shadow-md border border-gray-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-2/3">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <FaSearch />
              </span>
              <input
                type="text"
                placeholder="Tìm theo tên sự kiện, địa điểm..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="relative w-full sm:w-auto">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                {sortOption.endsWith('_desc') ? <FaSortAmountDown /> : <FaSortAmountUp />}
              </span>
              <label htmlFor="sort-select-schedule" className="sr-only">Sắp xếp theo</label>
              <select
                id="sort-select-schedule"
                value={sortOption}
                onChange={handleSortChange}
                className="w-full sm:w-auto pl-10 pr-8 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white appearance-none"
              >
                <option value="date_desc">Ngày: Mới nhất</option>
                <option value="date_asc">Ngày: Cũ nhất</option>
                <option value="price_asc">Giá: Thấp đến Cao</option>
                <option value="price_desc">Giá: Cao đến Thấp</option>
              </select>
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                ▼
              </span>
            </div>
          </div>

          {/* Loading, Error, No Data messages */}
          {loading && (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-lg text-gray-600">Đang tải lịch trình...</p>
            </div>
          )}
          {error && (
            <div className="text-center text-red-600 bg-red-100 p-4 rounded-md max-w-lg mx-auto shadow border border-red-200">
              <span className='font-semibold'>Lỗi tải dữ liệu:</span> {error}
            </div>
          )}
          {!loading && !error && displayedSchedules.length === 0 && (
            <div className="text-center text-gray-500 py-20">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-xl">
                {searchTerm
                  ? `Không tìm thấy lịch trình phù hợp với "${searchTerm}".`
                  : 'Hiện chưa có lịch trình nào.'
                }
              </p>
            </div>
          )}

          {/* Hiển thị danh sách lịch trình */}
          {!loading && !error && displayedSchedules.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
              {displayedSchedules.map((schedule) => {
                const statusDisplay = getScheduleStatusDisplay(schedule.status);
                const canAddToCart = schedule.type === 'concert' &&
                  schedule.status !== 'cancelled' &&
                  schedule.status !== 'postponed' &&
                  schedule.status !== 'completed' && // Thêm điều kiện completed
                  schedule.price != null &&
                  schedule.price > 0;

                return (
                  <div
                    key={schedule._id}
                    className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col border border-gray-200 h-full group"
                  >
                    <div className="p-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-xl">
                      <h2 className="text-xl font-bold truncate group-hover:text-yellow-300 transition-colors" title={schedule.eventName}>
                        {schedule.eventName}
                      </h2>
                      {statusDisplay && (
                        <span className={`mt-1 inline-block text-xs font-semibold px-2 py-0.5 rounded ${statusDisplay.className}`}>
                          {statusDisplay.text}
                        </span>
                      )}
                    </div>

                    <div className="p-5 flex-grow space-y-3 text-sm">
                      <div className="flex items-start text-gray-700">
                        <FaCalendarAlt className="mr-2 mt-0.5 text-indigo-500 flex-shrink-0" aria-hidden="true" />
                        <span><strong className="font-medium text-gray-800">Ngày:</strong> {formatDate(schedule.date)}</span>
                      </div>
                      <div className="flex items-start text-gray-700">
                        <FaClock className="mr-2 mt-0.5 text-indigo-500 flex-shrink-0" aria-hidden="true" />
                        <span><strong className="font-medium text-gray-800">Thời gian:</strong> {schedule.startTime} {schedule.endTime ? ` - ${schedule.endTime}` : ''}</span>
                      </div>
                      <div className="flex items-start text-gray-700">
                        <FaMapMarkerAlt className="mr-2 mt-0.5 text-indigo-500 flex-shrink-0" aria-hidden="true" />
                        <span>
                          <strong className="font-medium text-gray-800">Địa điểm:</strong> {schedule.venue.name}
                          {schedule.venue.city ? `, ${schedule.venue.city}` : ''}
                        </span>
                      </div>
                      <div className="flex items-start text-gray-700">
                        <FaDollarSign className="mr-2 mt-0.5 text-indigo-500 flex-shrink-0" aria-hidden="true" />
                        <span><strong className="font-medium text-gray-800">Giá vé:</strong> {formatPrice(schedule.price)}</span>
                      </div>
                      {schedule.description && (
                        <p className="text-gray-600 pt-2 text-xs line-clamp-3 border-t border-gray-100 mt-3" title={schedule.description}>
                          {schedule.description}
                        </p>
                      )}
                    </div>

                    <div className="px-5 pb-5 pt-3 mt-auto border-t border-gray-100 flex justify-between items-center">
                      {canAddToCart ? (
                        <button
                          onClick={() => handleAddToCart(schedule)}
                          className="px-4 py-2 text-sm font-medium rounded-md shadow-sm bg-sky-600 text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition ease-in-out duration-150 flex items-center"
                          title="Thêm sự kiện vào giỏ hàng"
                        >
                          <FaShoppingCart className="inline mr-2" aria-hidden="true" />
                          Thêm vào giỏ
                        </button>
                      ) : (
                        <div /> // Div trống để giữ layout nếu không có nút
                      )}

                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleViewDetailsClick(schedule._id)}
                          className={`px-4 py-2 text-sm font-medium rounded-md shadow-sm transition ease-in-out duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${status === 'loading'
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                          title="Xem thông tin chi tiết lịch trình"
                        >
                          Chi tiết
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Yêu cầu Đăng nhập */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-[9999] flex justify-center items-center p-4">
          <div
            className="fixed inset-0 bg-[rgba(0,0,0,0.5)] transition-opacity"
            onClick={closeLoginPrompt}
          ></div>
          <div
            className="relative max-w-md w-full bg-yellow-50 border border-yellow-300 p-8 pt-10 rounded-lg shadow-xl text-center transform transition-all scale-95 opacity-0 animate-fade-in-scale z-[10000]"
            style={{ animationFillMode: 'forwards', animationDuration: '0.2s' }}
          >
            <button
              onClick={closeLoginPrompt}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 p-1 rounded-full transition-colors"
              title="Đóng"
              aria-label="Đóng thông báo"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <style jsx>{`
                          @keyframes fade-in-scale {
                              from { opacity: 0; transform: scale(0.95); }
                              to { opacity: 1; transform: scale(1); }
                          }
                          .animate-fade-in-scale {
                              animation-name: fade-in-scale;
                          }
                      `}</style>
            <svg className="mx-auto mb-4 w-12 h-12 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
            </svg>
            <h2 className="text-2xl font-semibold text-yellow-800 mb-4">Yêu cầu Đăng nhập</h2>
            <p className="text-gray-700 mb-6">
              Bạn cần đăng nhập để sử dụng tính năng này.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button onClick={handleGoLogin} className="px-6 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out w-full sm:w-auto">
                Đăng nhập
              </button>
              <button onClick={closeLoginPrompt} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md shadow hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition duration-150 ease-in-out w-full sm:w-auto">
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}