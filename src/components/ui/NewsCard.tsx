interface NewsCardProps {
  title: string;
  content: string;
  image: string;
  date: Date;
  author: string;
}

const NewsCard = ({ title, content, image, date, author }: NewsCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <img src={image} alt={title} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="text-xl font-semibold">{title}</h3>
        <div className="mt-2 text-sm text-gray-500">
          <span>{new Date(date).toLocaleDateString()}</span>
          <span className="mx-2">•</span>
          <span>{author}</span>
        </div>
        <p className="mt-2 text-gray-600 line-clamp-3">{content}</p>
        <button className="mt-4 text-red-600 hover:text-red-700">
          Read More →
        </button>
      </div>
    </div>
  );
};

export default NewsCard;