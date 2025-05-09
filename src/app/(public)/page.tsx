'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import MusicPlayer from '@/components/ui/MusicPlayer';
import NewsCard from '@/components/ui/NewsCard';
import MemberCard from '@/components/ui/MemberCard';
import { Member } from '@/types/member';
import { Music } from '@/types/music';
import { Schedule as ScheduleType, Venue as ScheduleVenueType } from '@/types/schedule'; // Đổi tên để tránh xung đột
import { useSession } from 'next-auth/react'; // << THÊM VÀO

import {
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaDollarSign,
  FaShoppingCart
} from 'react-icons/fa';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'react-toastify';

// Interface HomePageEvent giữ nguyên
interface HomePageEvent {
  _id: string;
  title: string;
  date: Date | string;
  location: string;
  image?: string;
  price: number;
  availableTickets?: number;
  startTime?: string;
  endTime?: string;
  description?: string;
  venue?: {
    name: string;
    address?: string;
    city?: string;
  };
  type?: string;
  status?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface HomeData {
  news: Array<{ _id: string; title: string; content: string; image: string; createdAt: string; author: string; }>;
  events: HomePageEvent[];
  featuredMusic: Music[];
}

// Hàm formatDate và formatPrice giữ nguyên
const formatDate = (dateString: string | Date | undefined | null): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn("formatDate: Chuỗi ngày không hợp lệ:", dateString);
      return 'Ngày không hợp lệ';
    }
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch (e) {
    console.error("formatDate: Lỗi khi định dạng ngày:", dateString, e);
    return 'Lỗi định dạng ngày';
  }
};

const formatPrice = (price: number | undefined | null): string => {
  if (price === undefined || price === null) {
    return 'N/A';
  }
  if (price === 0) {
    return 'Miễn phí';
  }
  return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
};


export default function Home() {
  const router = useRouter();
  const { addToCart } = useCart();
  const { data: session, status: sessionStatus } = useSession(); // << LẤY SESSION STATUS

  const [data, setData] = useState<HomeData>({ news: [], events: [], featuredMusic: [] });
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [errorMembers, setErrorMembers] = useState<string | null>(null);
  const bannerImages = ["/upload/home/hero-bg.jpg", "/upload/home/hero-bg2.jpg", "/upload/home/hero-bg3.jpg"];
  const [currentSlide, setCurrentSlide] = useState(0);

  // << THÊM STATE CHO LOGIN PROMPT TRÊN TRANG CHỦ >>
  const [showLoginPromptHome, setShowLoginPromptHome] = useState(false);


  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      try {
        const [newsRes, eventsRes, musicRes] = await Promise.all([
          fetch('/api/news?limit=3'),
          fetch('/api/schedule?limit=3&upcoming=true&sort=date_asc'),
          fetch('/api/music?featured=true')
        ]);

        const newsData = newsRes.ok ? await newsRes.json() : [];
        const eventsDataFromApi = eventsRes.ok ? await eventsRes.json() : [];

        const processedEvents: HomePageEvent[] = eventsDataFromApi.map((event: any) => ({
          _id: event._id,
          title: event.eventName || event.title,
          date: event.date,
          location: event.venue?.name || event.location || 'Chưa xác định',
          image: event.image,
          price: event.price,
          availableTickets: event.availableTickets,
          startTime: event.startTime,
          endTime: event.endTime,
          description: event.description,
          venue: event.venue ? {
            name: event.venue.name || 'Chưa xác định',
            address: event.venue.address,
            city: event.venue.city,
          } : { name: event.location || 'Chưa xác định' },
          type: event.type,
          status: event.status,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
        }));

        const allFeaturedMusic = musicRes.ok ? await musicRes.json() : [];
        const publishedFeaturedMusic = allFeaturedMusic.filter((track: Music) => track.isPublished);
        setData({ news: newsData, events: processedEvents, featuredMusic: publishedFeaturedMusic });

      } catch (error) { console.error('Trang chủ: Lỗi tải dữ liệu:', error); }
      finally { setLoading(false); }
    };
    fetchHomeData();
  }, []);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoadingMembers(true);
      setErrorMembers(null);
      try {
        const response = await fetch('/api/member');
        if (!response.ok) { throw new Error(`Không thể tải dữ liệu thành viên (${response.status})`); }
        const memberData = await response.json();
        const activeMembers = memberData.filter((member: Member) => member.isActive);
        setMembers(activeMembers);
      } catch (error: any) {
        console.error('Trang chủ: Lỗi tải thành viên:', error);
        setErrorMembers(error.message || 'Lỗi không xác định khi tải thành viên.');
      } finally {
        setLoadingMembers(false);
      }
    };
    fetchMembers();
  }, []);

  useEffect(() => {
    if (bannerImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [bannerImages.length]);

  const handlePrevClick = () => setCurrentSlide((prev) => (prev - 1 + bannerImages.length) % bannerImages.length);
  const handleNextClick = () => setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
  const handleDotClick = (idx: number) => setCurrentSlide(idx);

  // << CẬP NHẬT HÀM handleAddToCartOnHome >>
  const handleAddToCartOnHome = (event: HomePageEvent) => {
    if (sessionStatus === 'loading') {
      toast.info("Đang kiểm tra trạng thái đăng nhập...");
      return;
    }
    if (sessionStatus !== 'authenticated') {
      setShowLoginPromptHome(true); // Hiển thị modal yêu cầu đăng nhập
      return;
    }

    // Logic chuyển đổi HomePageEvent sang ScheduleType (giữ nguyên)
    let scheduleType: ScheduleType['type'];
    const validTypes: ScheduleType['type'][] = ["concert", "rehearsal", "meeting", "interview", "other"];
    if (event.type && validTypes.includes(event.type as ScheduleType['type'])) {
      scheduleType = event.type as ScheduleType['type'];
    } else {
      scheduleType = 'concert';
    }

    let scheduleStatus: ScheduleType['status'];
    const validStatuses: ScheduleType['status'][] = ["scheduled", "cancelled", "postponed", "completed"];
    if (event.status && validStatuses.includes(event.status as ScheduleType['status'])) {
      scheduleStatus = event.status as ScheduleType['status'];
    } else {
      scheduleStatus = 'scheduled';
    }

    let dateString: string;
    if (event.date instanceof Date) {
      dateString = event.date.toISOString();
    } else if (typeof event.date === 'string') {
      try {
        dateString = new Date(event.date).toISOString();
      } catch (e) {
        dateString = new Date().toISOString(); // Fallback
      }
    } else {
      dateString = new Date().toISOString(); // Fallback
    }

    const scheduleVenue: ScheduleVenueType = {
      name: event.venue?.name || event.location || 'N/A',
      address: event.venue?.address || '',
      city: event.venue?.city || '',
    };

    const nowISO = new Date().toISOString();

    const scheduleItem: ScheduleType = {
      _id: event._id,
      eventName: event.title,
      date: dateString,
      startTime: event.startTime || 'N/A',
      endTime: event.endTime,
      venue: scheduleVenue,
      price: event.price,
      description: event.description || '',
      type: scheduleType,
      status: scheduleStatus,
      createdAt: event.createdAt ? (typeof event.createdAt === 'string' ? event.createdAt : event.createdAt.toISOString()) : nowISO,
      updatedAt: event.updatedAt ? (typeof event.updatedAt === 'string' ? event.updatedAt : event.updatedAt.toISOString()) : nowISO,
    };

    addToCart(scheduleItem); // addToCart từ CartContext đã xử lý API và toast
    // toast.success(`Đã thêm "${scheduleItem.eventName}" vào giỏ hàng!`); // Toast này có thể đã có trong addToCart của context
  };

  // << THÊM HÀM handleViewDetailsOnHome >>
  const handleViewDetailsOnHome = (eventId: string) => {
    if (sessionStatus === 'loading') {
      // Có thể không cần toast ở đây nếu người dùng chỉ click xem chi tiết
      return;
    }
    if (sessionStatus !== 'authenticated') {
      setShowLoginPromptHome(true);
      return;
    }
    router.push(`/schedule/${eventId}`);
  };

  // << THÊM CÁC HÀM CHO MODAL LOGIN PROMPT >>
  const closeLoginPromptHome = () => setShowLoginPromptHome(false);
  const handleGoLoginHome = () => {
    router.push('/login'); // Chuyển hướng đến trang đăng nhập
    closeLoginPromptHome();
  };


  if (loading) {
    return (<Layout><div className="flex justify-center items-center min-h-screen"><div className="text-xl font-semibold animate-pulse text-gray-600">Đang tải nội dung trang chủ...</div></div></Layout>);
  }

  const SectionHeading = ({ title }: { title: string }) => (
    <div className="text-center mb-12 sm:mb-16">
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 tracking-tight inline-block py-2">
        {title}
      </h2>
    </div>
  );

  return (
    <Layout>
      {/* Hero Section */}
      <div className="relative h-[550px] sm:h-[600px] overflow-hidden bg-gray-900">
        <div className="absolute inset-0 z-0">
          {bannerImages.length > 0 && (
            <img
              src={bannerImages[currentSlide]}
              alt="Band Hero Background"
              className="w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
              style={{ objectFit: 'cover' }}
            />
          )}
        </div>
        <div className="absolute inset-0 bg-black/60 z-10"></div>
        {bannerImages.length > 1 && (
          <>
            <button aria-label="Previous Slide" className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 z-30 bg-black/40 text-white rounded-full p-2 hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-colors" onClick={handlePrevClick}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button aria-label="Next Slide" className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 z-30 bg-black/40 text-white rounded-full p-2 hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-colors" onClick={handleNextClick}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </>
        )}
        {bannerImages.length > 1 && (
          <div className="absolute bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 flex space-x-2 z-30">
            {bannerImages.map((_, idx) => (
              <button key={idx} aria-label={`Go to slide ${idx + 1}`} onClick={() => handleDotClick(idx)} className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${idx === currentSlide ? 'bg-white scale-110' : 'bg-gray-400/70 hover:bg-gray-300/90'} focus:outline-none focus:ring-1 focus:ring-white focus:ring-offset-1 focus:ring-offset-black/50 transition-all duration-300`} />
            ))}
          </div>
        )}
        <div className="relative z-20 h-full flex items-center justify-center text-white text-center px-4 pointer-events-none">
          <div className="pointer-events-auto max-w-3xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-3 sm:mb-4 animate-shine bg-gradient-to-r from-yellow-300 via-pink-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">Cyber Band</h1>
            <p className="text-base sm:text-lg md:text-xl animate-shine bg-gradient-to-r from-yellow-200 via-pink-300 to-blue-300 bg-clip-text text-transparent drop-shadow">Trải Nghiệm Âm Nhạc Đỉnh Cao</p>
          </div>
        </div>
      </div>

      {/* Upcoming Events Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-screen-xl">
          <SectionHeading title="Sự kiện Sắp Diễn Ra" />
          {data.events.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {data.events.slice(0, 6).map((event) => (
                  <div
                    key={event._id}
                    className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col border border-gray-200 h-full group"
                  >
                    {event.image && (
                      <div className="w-full h-48 sm:h-56 overflow-hidden relative">
                        <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
                        <h2 className="absolute bottom-0 left-0 p-4 text-xl font-bold text-white truncate w-full group-hover:text-yellow-300 transition-colors z-10" title={event.title}>
                          {event.title}
                        </h2>
                      </div>
                    )}
                    {!event.image && (
                      <div className="p-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-xl">
                        <h2 className="text-xl font-bold truncate group-hover:text-yellow-300 transition-colors" title={event.title}>
                          {event.title}
                        </h2>
                      </div>
                    )}
                    <div className="p-5 flex-grow space-y-3 text-sm">
                      <div className="flex items-start text-gray-700">
                        <FaCalendarAlt className="mr-2.5 mt-0.5 text-indigo-500 flex-shrink-0" size={14} />
                        <span><strong className="font-medium text-gray-800">Ngày:</strong> {formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-start text-gray-700">
                        <FaClock className="mr-2.5 mt-0.5 text-indigo-500 flex-shrink-0" size={14} />
                        <span><strong className="font-medium text-gray-800">Thời gian:</strong> {event.startTime || 'N/A'}{event.endTime ? ` - ${event.endTime}` : ''}</span>
                      </div>
                      <div className="flex items-start text-gray-700">
                        <FaMapMarkerAlt className="mr-2.5 mt-0.5 text-indigo-500 flex-shrink-0" size={14} />
                        <span>
                          <strong className="font-medium text-gray-800">Địa điểm:</strong> {event.venue?.name || event.location}
                          {event.venue?.city ? `, ${event.venue.city}` : ''}
                        </span>
                      </div>
                      <div className="flex items-start text-gray-700">
                        <FaDollarSign className="mr-2.5 mt-0.5 text-indigo-500 flex-shrink-0" size={14} />
                        <span><strong className="font-medium text-gray-800">Giá vé:</strong> {formatPrice(event.price)}</span>
                      </div>
                      {event.description && (
                        <p className="text-gray-600 pt-2 text-xs line-clamp-2 border-t border-gray-100 mt-3" title={event.description}>
                          {event.description}
                        </p>
                      )}
                    </div>

                    <div className="px-5 pb-5 pt-3 mt-auto border-t border-gray-200 flex flex-col sm:flex-row gap-3 items-center">
                      {(event.type === 'concert' || !event.type) && // Mặc định là concert nếu không có type
                        event.status !== 'cancelled' &&
                        event.status !== 'postponed' &&
                        event.price > 0 && // Chỉ hiển thị nếu có giá
                        (event.availableTickets === undefined || event.availableTickets > 0) && // Còn vé hoặc không quản lý số lượng
                        <button
                          onClick={() => handleAddToCartOnHome(event)} // << SỬ DỤNG HÀM ĐÃ CẬP NHẬT
                          className="w-full sm:flex-1 px-4 py-2.5 text-sm font-medium rounded-md shadow-sm bg-sky-600 text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition ease-in-out duration-150 flex items-center justify-center"
                          title="Thêm sự kiện vào giỏ hàng"
                        >
                          <FaShoppingCart className="inline mr-2" />
                          Thêm vào giỏ
                        </button>
                      }
                      {/* Các điều kiện hiển thị "Hết vé", "Đã Hủy", "Tạm Hoãn" giữ nguyên */}
                      {(event.type === 'concert' || !event.type) && event.status !== 'cancelled' && event.status !== 'postponed' && (event.availableTickets !== undefined && event.availableTickets <= 0) && (
                        <span className="w-full sm:flex-1 text-center px-4 py-2.5 text-sm font-medium rounded-md bg-red-100 text-red-700 border border-red-200">
                          Hết vé
                        </span>
                      )}
                      {(event.status === 'cancelled' || event.status === 'postponed') && (
                        <span className={`w-full sm:flex-1 text-center px-4 py-2.5 text-sm font-medium rounded-md border ${event.status === 'cancelled' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                          }`}>
                          {event.status === 'cancelled' ? 'Đã Hủy' : 'Tạm Hoãn'}
                        </span>
                      )}
                      {/* << THAY THẾ Link BẰNG button >> */}
                      <button
                        onClick={() => handleViewDetailsOnHome(event._id)}
                        className="w-full sm:flex-1 px-4 py-2.5 text-sm font-medium rounded-md shadow-sm bg-blue-100 text-blue-700 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition ease-in-out duration-150 text-center block"
                        title="Xem thông tin chi tiết lịch trình"
                      >
                        Xem Chi Tiết
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center pt-12 sm:pt-16 flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6">
                <Link href="/booking" className="shine-btn w-full sm:w-auto max-w-xs px-6 py-3 rounded-full text-white font-semibold transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500">
                  Đặt Lịch Sự Kiện Riêng
                </Link>
                <Link href="/schedule" className="shine-btn w-full sm:w-auto max-w-xs px-6 py-3 rounded-full text-white font-semibold transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-purple-500">
                  Xem Tất Cả Lịch Sự Kiện
                </Link>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-600 py-10">Hiện tại không có sự kiện nào sắp diễn ra.</p>
          )}
        </div>
      </section>

      {/* Band Members Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-screen-xl">
          <SectionHeading title="Thành viên ban nhạc" />
          {loadingMembers ? (
            <div className="text-center text-gray-500 py-10">Đang tải thông tin thành viên...</div>
          ) : errorMembers ? (
            <div className="text-center text-red-600 bg-red-100 p-4 rounded-md">{errorMembers}</div>
          ) : members.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                {members.slice(0, 3).map((member) => (
                  <MemberCard
                    key={member._id.toString()}
                    _id={member._id.toString()}
                    name={member.name}
                    role={member.role}
                    image={member.image || '/default-member.png'}
                    description={member.description}
                    socialLinks={member.socialLinks || {}}
                  />
                ))}
              </div>
              {members.length > 3 && (
                <div className="text-center pt-12 sm:pt-16">
                  <Link href="/member" className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-2.5 px-7 rounded-full shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Xem tất cả thành viên &rarr;
                  </Link>
                </div>
              )}
            </>
          ) : (<p className="text-center text-gray-600 py-10">Không tìm thấy thông tin thành viên.</p>)}
        </div>
      </section>

      {/* Featured Music Section */}
      <section className="py-16 sm:py-20 bg-gray-100">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-screen-xl">
          <SectionHeading title="Bài hát nổi bật" />
          {data.featuredMusic.length > 0 ? (
            <div className="space-y-8 max-w-4xl mx-auto">
              {data.featuredMusic.slice(0, 3).map((track) => (
                <div key={track._id} className="rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden bg-white border border-gray-100">
                  <MusicPlayer
                    title={track.title}
                    artist={track.artist}
                    image={track.image}
                    audio={track.audio}
                    description={track.description}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 py-10">Hiện chưa có bài hát nổi bật nào.</p>
          )}
          <div className="text-center pt-12 sm:pt-16">
            <Link href="/music" className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-2.5 px-7 rounded-full shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Xem tất cả bài hát &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Latest News Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-screen-xl">
          <SectionHeading title="Tin tức mới nhất" />
          {data.news.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                {data.news.slice(0, 3).map((item) => (
                  <NewsCard
                    key={item._id}
                    _id={item._id}
                    title={item.title}
                    content={item.content}
                    image={item.image || '/default-news.png'}
                    createdAt={item.createdAt}
                    author={item.author}
                  />
                ))}
              </div>
              {data.news.length > 3 && (
                <div className="text-center pt-12 sm:pt-16">
                  <Link href="/news" className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-2.5 px-7 rounded-full shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Xem tất cả tin tức &rarr;
                  </Link>
                </div>
              )}
            </>
          ) : (<p className="text-center text-gray-600 py-10">Chưa có tin tức nào.</p>)}
        </div>
      </section>

      {/* << THÊM MODAL YÊU CẦU ĐĂNG NHẬP >> */}
      {showLoginPromptHome && (
        <div className="fixed inset-0 z-[9999] flex justify-center items-center p-4">
          <div
            className="fixed inset-0 bg-[rgba(0,0,0,0.5)] transition-opacity"
            onClick={closeLoginPromptHome} // Sử dụng hàm đóng của trang chủ
          ></div>
          <div
            className="relative max-w-md w-full bg-yellow-50 border border-yellow-300 p-8 pt-10 rounded-lg shadow-xl text-center transform transition-all scale-95 opacity-0 animate-fade-in-scale z-[10000]"
            style={{ animationFillMode: 'forwards', animationDuration: '0.2s' }}
          >
            <button
              onClick={closeLoginPromptHome} // Sử dụng hàm đóng của trang chủ
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
              <button
                onClick={handleGoLoginHome} // Sử dụng hàm đăng nhập của trang chủ
                className="px-6 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out w-full sm:w-auto"
              >
                Đăng nhập
              </button>
              <button
                onClick={closeLoginPromptHome} // Sử dụng hàm đóng của trang chủ
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md shadow hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition duration-150 ease-in-out w-full sm:w-auto"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
