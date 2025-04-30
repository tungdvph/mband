'use client';
import { useEffect, useState } from 'react';
import MemberCard from '@/components/ui/MemberCard';
import Layout from '@/components/layout/Layout';
import { Member } from '@/types/member'; // Đảm bảo đường dẫn import đúng

export default function MemberPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Placeholder - Bạn cần thay thế bằng tên và địa điểm thực tế
  const bandName = "KUBE"; // Thay bằng tên ban nhạc của bạn
  const bandOrigin = "RIAU"; // Thay bằng địa điểm hoặc đặc điểm

  const introText = `Chào mừng đến với ngôi nhà chung của ${bandName}! Đây là nơi bạn có thể gặp gỡ và tìm hiểu sâu hơn về từng gương mặt tài năng đã cùng nhau tạo nên những giai điệu đầy cảm xúc mà bạn yêu thích. Mỗi thành viên, với cá tính và màu sắc riêng biệt, là một phần không thể thiếu trong hành trình âm nhạc của chúng tôi, góp phần tạo nên một tập thể độc đáo và gắn kết. Hãy cùng khám phá câu chuyện phía sau sân khấu, niềm đam mê mãnh liệt với âm nhạc, và vai trò đặc biệt của từng người trong ban nhạc. Chúng tôi tin rằng, qua trang này, bạn sẽ tìm thấy sự đồng điệu và càng thêm yêu mến những con người đứng sau các tác phẩm âm nhạc này.`;

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/member');
        if (!response.ok) {
          throw new Error('Failed to fetch members');
        }
        const data = await response.json();
        const activeMembers = data.filter((member: Member) => member.isActive);
        setMembers(activeMembers);
      } catch (error) {
        console.error('Error fetching members:', error);
        setError('Failed to load members');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  if (error) {
    return (
      <Layout>
        <div className="text-center text-red-600">{error}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        {/* Phần giới thiệu mới */}
        <div className="text-center mb-16"> {/* Canh giữa và tạo khoảng cách dưới */}
          <h2 className="text-4xl font-serif font-semibold mb-2 tracking-wide"> {/* Style giống ảnh */}
            CHÚNG TÔI LÀ <span className="text-red-600">{bandName.toUpperCase()}</span> {/* Tên band màu đỏ */}
          </h2>
          <h3 className="text-3xl font-serif font-medium text-gray-700 dark:text-gray-300 tracking-wide mb-8"> {/* Style giống ảnh */}
            BAN NHẠC TỪ - {bandOrigin.toUpperCase()}
          </h3>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed justify-center-last"> {/* Giới hạn chiều rộng, canh đều */}
            {introText}
          </p>
        </div>
        {/* Kết thúc phần giới thiệu */}

        <h1 className="text-4xl font-bold mb-12 text-center text-color-cycle"> {/* Canh giữa tiêu đề thành viên */}
          Gặp Gỡ Các Thành Viên
        </h1>

        {loading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"> {/* Điều chỉnh grid layout nếu cần */}
            {members.map((member) => (
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
        )}
      </div>
    </Layout>
  );
}