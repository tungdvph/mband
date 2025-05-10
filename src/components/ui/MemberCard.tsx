// src/components/ui/MemberCard.tsx 
import Link from 'next/link';

interface MemberCardProps {
  _id: string;
  name: string;
  role: string;
  image: string;
  description?: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

const MemberCard = ({ _id, name, role, image, description = '', socialLinks }: MemberCardProps) => {
  return (
    // Khung card chính - Thêm group để làm hiệu ứng hover cho cả card nếu muốn
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden group transition duration-300 ease-in-out hover:shadow-xl">
      {/* Phần ảnh */}
      <div className="overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-[32rem] object-cover transition duration-500 ease-in-out group-hover:scale-105" // Hiệu ứng zoom ảnh khi hover card
        />
      </div>
      {/* Phần nội dung chữ */}
      <div className="p-4">
        {/* === THÊM CLASS 'text-color-cycle' VÀO ĐÂY === */}
        <h3 className="text-xl font-semibold text-color-cycle">{name}</h3>
        {/* ============================================ */}

        <p className="text-red-600 dark:text-red-400">{role}</p> {/* Giữ nguyên hoặc thêm hiệu ứng khác nếu muốn */}
        <p className="mt-2 text-gray-600 dark:text-gray-300 line-clamp-3 text-sm">
          {description}
        </p>
        {/* ... (Phần social links và link chi tiết giữ nguyên) ... */}
        <div className="mt-4 flex space-x-4">
          {socialLinks.facebook && (
            <a
              href={socialLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
              aria-label={`${name} Facebook profile`}
            >
              Facebook
            </a>
          )}
          {socialLinks.instagram && (
            <a
              href={socialLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors duration-200"
              aria-label={`${name} Instagram profile`}
            >
              Instagram
            </a>
          )}
          {socialLinks.twitter && (
            <a
              href={socialLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 dark:text-gray-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors duration-200"
              aria-label={`${name} Twitter profile`}
            >
              Twitter
            </a>
          )}
        </div>
        <Link href={`/member/${_id}`}>
          <span className="mt-4 inline-block text-red-600 dark:text-red-400 font-medium hover:text-red-800 dark:hover:text-red-200 transition-colors duration-200 hover:underline">
            Xem chi tiết →
          </span>
        </Link>
      </div>
    </div>
  );
};

export default MemberCard;