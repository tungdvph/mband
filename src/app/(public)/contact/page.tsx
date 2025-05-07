'use client';
import Layout from '@/components/layout/Layout';
import Link from 'next/link';
// Import các icon từ react-icons
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiMusic,
  FiCalendar,
  FiUsers,
  FiInfo,
  FiPlayCircle,
  FiMic,
  FiArrowRightCircle // Icon cho nút "Xem thêm"
} from 'react-icons/fi';

export default function ContactPage() {
  const features = [
    {
      icon: <FiPlayCircle className="w-10 h-10 mb-4 text-red-500" />,
      title: 'Khám Phá Âm Nhạc Độc Quyền',
      description: 'Nghe những bản nhạc mới nhất, những ca khúc nổi bật và album độc quyền từ CyberBand. Trải nghiệm âm thanh chất lượng cao mọi lúc mọi nơi.',
      link: '/music',
      linkLabel: 'Nghe nhạc ngay',
    },
    {
      icon: <FiCalendar className="w-10 h-10 mb-4 text-teal-500" />,
      title: 'Sự Kiện & Vé Trực Tuyến',
      description: 'Không bỏ lỡ bất kỳ buổi biểu diễn nào! Xem lịch trình sự kiện, thông tin chi tiết và đặt vé tham gia các show diễn của CyberBand một cách dễ dàng.',
      link: '/schedule',
      linkLabel: 'Xem lịch sự kiện',
    },
    {
      icon: <FiMic className="w-10 h-10 mb-4 text-purple-500" />,
      title: 'Đặt Lịch Biểu Diễn Chuyên Nghiệp',
      description: 'Bạn muốn CyberBand khuấy động sự kiện của bạn? Liên hệ đặt lịch biểu diễn cho các sự kiện cá nhân, công ty hoặc lễ hội một cách chuyên nghiệp và ấn tượng.',
      link: '/booking',
      linkLabel: 'Đặt lịch biểu diễn',
    },
    {
      icon: <FiUsers className="w-10 h-10 mb-4 text-pink-500" />,
      title: 'Gặp Gỡ Các Thành Viên Tài Năng',
      description: 'Tìm hiểu thêm về từng thành viên tài năng của CyberBand, khám phá câu chuyện âm nhạc và vai trò của họ trong việc tạo nên những sản phẩm chất lượng.',
      link: '/member',
      linkLabel: 'Xem thành viên',
    },
    {
      icon: <FiInfo className="w-10 h-10 mb-4 text-orange-500" />,
      title: 'Cập Nhật Tin Tức & Hoạt Động',
      description: 'Theo dõi những tin tức mới nhất, các dự án âm nhạc sắp ra mắt và những hoạt động phía sau hậu trường đầy thú vị của CyberBand.',
      link: '/news',
      linkLabel: 'Đọc tin tức',
    },
    {
      icon: <FiMusic className="w-10 h-10 mb-4 text-indigo-500" />, // Sử dụng FiMusic hoặc một icon khác phù hợp
      title: 'Trải Nghiệm Trang Chủ Đa Dạng',
      description: 'Quay lại trang chủ để khám phá tổng quan tất cả các hoạt động, sản phẩm mới và những gì CyberBand đang mang đến cho cộng đồng yêu nhạc.',
      link: '/',
      linkLabel: 'Về Trang Chủ',
    }
  ];

  return (
    <Layout>
      <div className="bg-slate-50 py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Phần Tiêu Đề Chính */}
          <div className="text-center mb-16 sm:mb-20">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 tracking-tight">
              Kết Nối Với CyberBand
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto">
              Chúng tôi luôn trân trọng sự quan tâm của bạn. Dưới đây là thông tin liên hệ chi tiết và một cái nhìn tổng quan về những trải nghiệm bạn có thể tìm thấy trên website.
            </p>
          </div>

          {/* Phần Thông Tin Liên Hệ */}
          <div className="max-w-2xl mx-auto bg-white shadow-2xl rounded-xl p-8 sm:p-10 lg:p-12 mb-20 lg:mb-24 border border-slate-200">
            <h2 className="text-3xl font-bold text-slate-800 mb-8 pb-4 border-b-2 border-indigo-500 inline-block">
              Thông Tin Liên Hệ
            </h2>
            <div className="space-y-6">
              <div className="flex items-start">
                <FiMail className="w-6 h-6 mr-4 text-indigo-600 shrink-0 mt-1" />
                <div>
                  <span className="block text-sm font-semibold text-slate-500 uppercase tracking-wider">Email</span>
                  <a href="mailto:cyberband@gmail.com" className="text-lg text-indigo-700 hover:text-indigo-900 hover:underline font-medium">
                    cyberband@gmail.com
                  </a>
                </div>
              </div>
              <div className="flex items-start">
                <FiPhone className="w-6 h-6 mr-4 text-indigo-600 shrink-0 mt-1" />
                <div>
                  <span className="block text-sm font-semibold text-slate-500 uppercase tracking-wider">Điện thoại</span>
                  <a href="tel:0387532890" className="text-lg text-indigo-700 hover:text-indigo-900 hover:underline font-medium">
                    038 753-2890
                  </a>
                </div>
              </div>
              <div className="flex items-start">
                <FiMapPin className="w-6 h-6 mr-4 text-indigo-600 shrink-0 mt-1" />
                <div>
                  <span className="block text-sm font-semibold text-slate-500 uppercase tracking-wider">Địa chỉ</span>
                  <p className="text-lg text-slate-700 font-medium">Thành phố Hà Nội, Việt Nam</p>
                </div>
              </div>
            </div>
            <p className="mt-8 text-sm text-slate-500 italic">
              Chúng tôi cố gắng phản hồi tất cả các yêu cầu trong vòng 24 giờ làm việc.
            </p>
          </div>

          {/* Phần Giới Thiệu Tính Năng Trang Web */}
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 text-center mb-16 sm:mb-20">
              Khám Phá Các Tính Năng Nổi Bật
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col group hover:shadow-2xl transition-all duration-300 border border-slate-100"
                >
                  <div className="p-8 flex flex-col flex-grow items-center text-center md:items-start md:text-left"> {/* Căn giữa icon và text trên mobile, căn trái trên desktop */}
                    {feature.icon} {/* Hiển thị icon */}
                    <h3 className="text-2xl font-bold text-indigo-700 mb-4 group-hover:text-purple-700 transition-colors duration-300 mt-2 md:mt-0">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 text-base mb-6 flex-grow leading-relaxed">
                      {feature.description}
                    </p>
                    {feature.link && feature.linkLabel && (
                      <Link
                        href={feature.link}
                        className="inline-flex items-center justify-center mt-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2.5 px-6 rounded-lg text-base transition-all duration-300 transform group-hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400"
                      >
                        {feature.linkLabel}
                        <FiArrowRightCircle className="ml-2 w-5 h-5" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}