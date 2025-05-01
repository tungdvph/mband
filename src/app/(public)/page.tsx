'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import MusicPlayer from '@/components/ui/MusicPlayer';
import NewsCard from '@/components/ui/NewsCard';
import EventCard from '@/components/ui/EventCard';
import MemberCard from '@/components/ui/MemberCard';
import { Member } from '@/types/member';
import { Music } from '@/types/music';

// Interface cho dữ liệu trang Home
interface HomeData {
  news: Array<{ _id: string; title: string; content: string; image: string; createdAt: string; author: string; }>;
  events: Array<{ _id: string; title: string; date: Date | string; location: string; image: string; price: number; availableTickets: number; }>;
  featuredMusic: Music[]; // <<< SỬA: Sử dụng kiểu Music đã import
}

export default function Home() {
  // --- State Variables ---
  const [data, setData] = useState<HomeData>({ news: [], events: [], featuredMusic: [] });
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [errorMembers, setErrorMembers] = useState<string | null>(null);
  const bannerImages = ["/upload/home/hero-bg.jpg", "/upload/home/hero-bg2.jpg", "/upload/home/hero-bg3.jpg"];
  const [currentSlide, setCurrentSlide] = useState(0);

  // --- Data Fetching Effects ---
  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      try {
        const [newsRes, eventsRes, musicRes] = await Promise.all([
          fetch('/api/news?limit=3'),
          fetch('/api/schedule?limit=3'),
          fetch('/api/music?featured=true') // Vẫn lấy tất cả featured music từ API
        ]);

        const news = newsRes.ok ? await newsRes.json() : [];
        const events = eventsRes.ok ? await eventsRes.json() : [];
        const allFeaturedMusic = musicRes.ok ? await musicRes.json() : [];

        if (!newsRes.ok) console.error('Failed to fetch news');
        if (!eventsRes.ok) console.error('Failed to fetch events');
        if (!musicRes.ok) console.error('Failed to fetch featured music');

        // <<< THÊM: Lọc các bài hát đã được xuất bản (isPublished === true)
        const publishedFeaturedMusic = allFeaturedMusic.filter((track: Music) => track.isPublished);

        setData({ news, events, featuredMusic: publishedFeaturedMusic }); // <<< SỬA: Lưu danh sách đã lọc vào state
      } catch (error) { console.error('Error fetching home data:', error); }
      finally { setLoading(false); }
    };
    fetchHomeData();
  }, []);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoadingMembers(true);
      try {
        const response = await fetch('/api/member');
        if (!response.ok) { throw new Error(`Không thể tải dữ liệu thành viên (${response.status})`); }
        const memberData = await response.json();
        const activeMembers = memberData.filter((member: Member) => member.isActive);
        setMembers(activeMembers);
        setErrorMembers(null);
      } catch (error: any) { console.error('Error fetching members:', error); setErrorMembers(error.message || 'Lỗi không xác định khi tải thành viên.'); }
      finally { setLoadingMembers(false); }
    };
    fetchMembers();
  }, []);

  // --- Slideshow Effect ---
  useEffect(() => {
    if (bannerImages.length === 0) return;
    const interval = setInterval(() => { setCurrentSlide((prev) => (prev + 1) % bannerImages.length); }, 4000);
    return () => clearInterval(interval);
  }, [bannerImages.length]);

  // --- Loading State UI ---
  if (loading || loadingMembers) {
    return (<Layout><div className="flex justify-center items-center min-h-screen"><div className="text-xl font-semibold animate-pulse text-gray-600">Đang tải nội dung...</div></div></Layout>);
  }

  // --- Reusable Helper Components ---
  const SectionHeading = ({ title }: { title: string }) => (<div className="text-center mb-16"> <h2 className="text-3xl md:text-4xl font-bold text-gray-800 inline-block relative pb-2">{title}<span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-1 w-24 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></span></h2></div>);
  const ViewAllButton = ({ href, children }: { href: string, children: React.ReactNode }) => (<div className="text-center pt-12"> <Link href={href} className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-2.5 px-7 rounded-full shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">{children} &rarr;</Link></div>);

  // --- Main Component Render ---
  return (
    <Layout>
      {/* Hero Section */}
      <div className="relative h-[600px] overflow-hidden bg-gray-900">
        {/* Phần Hero Section giữ nguyên như cũ */}
        <div className="absolute inset-0 bg-black/50 z-10">{bannerImages.length > 0 && (<img src={bannerImages[currentSlide]} alt="Band Hero Background" className="w-full h-full object-cover transition-opacity duration-1000" style={{ objectFit: 'cover' }} key={currentSlide} />)}</div>
        {bannerImages.length > 1 && (<> <button aria-label="Previous Slide" className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-black/40 text-white rounded-full p-2 hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-colors" onClick={() => setCurrentSlide((prev) => (prev - 1 + bannerImages.length) % bannerImages.length)}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg></button> <button aria-label="Next Slide" className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-black/40 text-white rounded-full p-2 hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-colors" onClick={() => setCurrentSlide((prev) => (prev + 1) % bannerImages.length)}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg></button> </>)}
        {bannerImages.length > 1 && (<div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex space-x-2 z-20">{bannerImages.map((_, idx) => (<button key={idx} aria-label={`Go to slide ${idx + 1}`} onClick={() => setCurrentSlide(idx)} className={`w-3 h-3 rounded-full ${idx === currentSlide ? 'bg-white scale-110' : 'bg-gray-400/70 hover:bg-gray-300/90'} focus:outline-none focus:ring-1 focus:ring-white focus:ring-offset-1 focus:ring-offset-black/50 transition-all duration-300`} />))}</div>)}
        <div className="relative z-20 h-full flex items-center justify-center text-white text-center px-4"><div><h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4 animate-shine bg-gradient-to-r from-yellow-300 via-pink-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">Band Name</h1><p className="text-lg md:text-xl mb-8 animate-shine bg-gradient-to-r from-yellow-200 via-pink-300 to-blue-300 bg-clip-text text-transparent drop-shadow">Trải Nghiệm Âm Nhạc</p><div className="flex flex-col sm:flex-row justify-center gap-4"><Link href="/booking" className="shine-btn px-8 py-3 rounded-full text-white font-semibold transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/50 focus:ring-white">Đặt Lịch Ngay</Link><Link href="/schedule" className="shine-btn px-8 py-3 rounded-full text-white font-semibold transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/50 focus:ring-white">Đặt Vé Ngay</Link></div></div></div>
      </div>

      {/* --- Content Sections --- */}

      {/* Band Members Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-100">
        <div className="container mx-auto px-6 md:px-8 max-w-screen-xl">
          <SectionHeading title="Thành viên ban nhạc" />
          {errorMembers ? (
            <div className="text-center text-red-600 bg-red-100 p-4 rounded-md">{errorMembers}</div>
          ) : members.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-10">
                {/* Chỉ hiển thị tối đa 3 */}
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
              {/* Nút xem tất cả hiển thị nếu có thành viên */}
              <ViewAllButton href="/member">Xem tất cả thành viên</ViewAllButton>
            </>
          ) : (<p className="text-center text-gray-600">Không tìm thấy thông tin thành viên.</p>)}
        </div>
      </section>

      {/* Featured Music Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 md:px-8 max-w-screen-xl">
          <SectionHeading title="Bài hát nổi bật" />
          {/* <<< SỬA: Kiểm tra data.featuredMusic (đã lọc) */}
          {data.featuredMusic.length > 0 ? (
            <>
              <div className="space-y-8 max-w-4xl mx-auto">
                {/* Chỉ hiển thị tối đa 3 bài hát đã xuất bản */}
                {data.featuredMusic.slice(0, 3).map((track) => (
                  <div key={track._id} className="rounded-xl shadow-lg overflow-hidden bg-white border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                    {/* Truyền đầy đủ props từ track (đã có kiểu Music) */}
                    <MusicPlayer
                      title={track.title}
                      artist={track.artist}
                      image={track.image}
                      audio={track.audio}
                      description={track.description} // MusicPlayer cần prop này
                    />
                  </div>
                ))}
              </div>
              {/* Nút xem tất cả hiển thị nếu có bài hát đã xuất bản */}
              <ViewAllButton href="/music">Xem tất cả bài hát</ViewAllButton>
            </>
          ) : (<p className="text-center text-gray-600">Hiện chưa có bài hát nổi bật nào được phát hành.</p>)}
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-20 bg-gray-100">
        <div className="container mx-auto px-6 md:px-8 max-w-screen-xl">
          <SectionHeading title="Sự kiện sắp tới" />
          {/* API đã giới hạn 3, map trực tiếp */}
          {data.events.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-10">
                {/* <<< SỬA (nhỏ): Thêm slice(0, 3) cho rõ ràng, dù API đã giới hạn */}
                {data.events.slice(0, 3).map((event) => (
                  <EventCard
                    key={event._id}
                    title={event.title}
                    // Chuyển đổi date nếu là string
                    date={typeof event.date === 'string' ? new Date(event.date) : event.date}
                    location={event.location}
                    image={event.image}
                    price={event.price}
                    availableTickets={event.availableTickets}
                  />
                ))}
              </div>
              {/* Nút xem tất cả hiển thị nếu có sự kiện */}
              <ViewAllButton href="/schedule">Xem tất cả sự kiện</ViewAllButton>
            </>
          ) : (<p className="text-center text-gray-600">Hiện tại không có sự kiện nào sắp diễn ra.</p>)}
        </div>
      </section>

      {/* Latest News Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 md:px-8 max-w-screen-xl">
          <SectionHeading title="Tin tức mới nhất" />
          {/* API đã giới hạn 3 */}
          {data.news.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-10">
                {/* <<< SỬA: Thêm .slice(0, 3) để chắc chắn chỉ hiển thị tối đa 3 tin */}
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
              {/* Nút xem tất cả hiển thị nếu có tin tức */}
              <ViewAllButton href="/news">Xem tất cả tin tức</ViewAllButton>
            </>
          ) : (<p className="text-center text-gray-600">Chưa có tin tức nào.</p>)}
        </div>
      </section>

    </Layout>
  );
}