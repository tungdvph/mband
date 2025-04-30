'use client';

import Link from 'next/link';
import Image from 'next/image'; // Sử dụng Next.js Image để tối ưu hóa ảnh
// Cài đặt react-icons: npm install react-icons
import { FaCalendarAlt, FaUserEdit } from 'react-icons/fa';

interface NewsCardProps {
  _id: string;
  title: string;
  content: string; // Giả sử đây là nội dung đầy đủ hoặc excerpt
  image: string;   // Ảnh giờ là bắt buộc (đã xử lý fallback ở NewsPage)
  createdAt: string; // Đổi từ Date sang string (ISO date string)
  author?: string; // <-- SỬA Ở ĐÂY: Cho phép author là tùy chọn
}

export default function NewsCard({ _id, title, content, image, createdAt, author }: NewsCardProps) {

  // Định dạng ngày tháng (có thể dùng thư viện như date-fns nếu cần phức tạp hơn)
  const formattedDate = new Date(createdAt).toLocaleDateString('vi-VN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  // Tạo excerpt ngắn gọn từ content (loại bỏ HTML và cắt ngắn)
  // Cách này cơ bản, có thể không hoàn hảo với HTML phức tạp.
  // Nên tạo excerpt ở backend hoặc dùng thư viện nếu nội dung phức tạp.
  const plainTextContent = content.replace(/<[^>]*>/g, '');
  const excerpt = plainTextContent.length > 100
    ? plainTextContent.substring(0, 100) + '...'
    : plainTextContent;

  const detailUrl = `/news/${_id}`; // Đường dẫn đến trang chi tiết

  return (
    // Bọc toàn bộ thẻ bằng Link để cả thẻ có thể click được
    <Link href={detailUrl} className="group block h-full">
      {/* Thẻ (Card) */}
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full border border-gray-100">
        {/* Phần ảnh */}
        <div className="relative w-full h-48 overflow-hidden">
          {/* Sử dụng next/image */}
          <Image
            src={image}
            alt={title || 'Ảnh tin tức'}
            fill // Fill sẽ tự động điều chỉnh kích thước ảnh
            style={{ objectFit: 'cover' }} // Tương đương object-cover
            className="transition-transform duration-300 group-hover:scale-105" // Hiệu ứng zoom khi hover
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" // Giúp tối ưu tải ảnh
            priority={false} // Đặt là true cho ảnh quan trọng ở màn hình đầu tiên
          />
        </div>

        {/* Phần nội dung text */}
        <div className="p-5 flex flex-col flex-grow"> {/* Thêm flex-grow để đẩy phần "Đọc thêm" xuống cuối nếu cần */}
          {/* Tiêu đề */}
          <h3 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors duration-200 line-clamp-2 mb-2" title={title}>
            {title || 'Tiêu đề không có'}
          </h3>

          {/* Thông tin Meta (Ngày đăng, Tác giả) */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mb-3">
            <div className="flex items-center">
              <FaCalendarAlt className="mr-1 opacity-80" />
              <time dateTime={createdAt}>{formattedDate}</time> {/* Thêm dateTime */}
            </div>
            {/* Chỉ hiển thị tác giả nếu có */}
            {author && (
              <div className="flex items-center">
                <FaUserEdit className="mr-1 opacity-80" />
                <span>{author}</span>
              </div>
            )}
          </div>

          {/* Đoạn trích nội dung */}
          <p className="text-sm text-gray-600 line-clamp-3 mb-4">
            {excerpt || 'Không có nội dung xem trước.'}
          </p>

          {/* "Đọc thêm" - Đẩy xuống cuối bằng mt-auto */}
          <div className="mt-auto pt-2">
            <span className="text-sm font-medium text-indigo-600 group-hover:text-indigo-700 group-hover:underline transition-colors duration-200 flex items-center">
              Đọc thêm <span className="ml-1 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">&rarr;</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}