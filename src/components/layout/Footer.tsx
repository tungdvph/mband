import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-black text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">Tên Ban Nhạc</h3>
            <p className="text-gray-300">
              Trải nghiệm âm nhạc và sự kiện tuyệt vời nhất cùng chúng tôi. Đặt lịch ngay cho sự kiện tiếp theo của bạn!
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-4">Liên kết nhanh</h3>
            <div className="grid grid-cols-2 gap-4">
              <ul className="space-y-2">
                <li><Link href="/member" className="text-gray-300 hover:text-white">Thành viên</Link></li>
                <li><Link href="/schedule" className="text-gray-300 hover:text-white">Lịch trình</Link></li>
                <li><Link href="/music" className="text-gray-300 hover:text-white">Âm nhạc</Link></li>
              </ul>
              <ul className="space-y-2">
                <li><Link href="/news" className="text-gray-300 hover:text-white">Tin tức</Link></li>
                <li><Link href="/booking" className="text-gray-300 hover:text-white">Đặt lịch</Link></li>
                <li><Link href="/contact" className="text-gray-300 hover:text-white">Liên hệ</Link></li>
              </ul>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-4">Liên hệ</h3>
            <ul className="space-y-2 text-gray-300">
              <li>Email: contact@bandname.com</li>
              <li>Điện thoại: (123) 456-7890</li>
              <li>Địa chỉ: Thành phố của bạn, Quốc gia</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-800 pt-8 text-center">
          <p className="text-gray-300">&copy; {new Date().getFullYear()} Tên Ban Nhạc. Đã đăng ký bản quyền.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;