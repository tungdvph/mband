'use client';
import { useEffect, useState } from 'react';
import MemberCard from '@/components/ui/MemberCard';
import Layout from '@/components/layout/Layout';

// Thay thế interface Member bằng import
import { Member } from '@/types/member';

export default function MemberPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/member');
        if (!response.ok) {
          throw new Error('Failed to fetch members');
        }
        const data = await response.json();
        // Lọc chỉ lấy các thành viên đang hoạt động
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
        <h1 className="text-4xl font-bold mb-8">Our Members</h1>
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {members.map((member) => (
              // Sửa lại đường dẫn ảnh mặc định
              <MemberCard
                key={member._id.toString()} // Convert ObjectId to string
                name={member.name}
                role={member.role}
                image={member.image || '/default-member.png'} // Sửa từ default-avatar.png thành default-member.png
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