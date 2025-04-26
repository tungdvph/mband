import Link from 'next/link';

interface NewsCardProps {
  _id: string; // Thêm _id vào props
  title: string;
  content: string;
  image: string;
  date: Date;
  author: string;
}

const NewsCard = ({ _id, title, content, image, date, author }: NewsCardProps) => {
  // Loại bỏ các thẻ HTML từ nội dung để hiển thị text thuần túy
  const plainTextContent = content.replace(/<[^>]*>/g, '');
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <img src={image} alt={title} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="text-xl font-semibold">{title}</h3>
        <div className="mt-2 text-sm text-gray-500">
          <span>{date.toLocaleDateString('vi-VN')}</span>
          <span className="mx-2">•</span>
          <span>{author}</span>
        </div>
        <p className="mt-2 text-gray-600 line-clamp-3">{plainTextContent}</p>
        <Link href={`/news/${_id}`}>
          <span className="mt-4 inline-block text-red-600 hover:text-red-700">
            Xem Thêm →
          </span>
        </Link>
      </div>
    </div>
  );
};

export default NewsCard;