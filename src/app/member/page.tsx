'use client';
import { useEffect, useState } from 'react';
import MemberCard from '@/components/ui/MemberCard';
import Layout from '@/components/layout/Layout';

interface Member {
  _id: string;
  name: string;
  role: string;
  image: string;
  description: string;
  isActive: boolean;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };  // Removed optional chaining from socialLinks
}

export default function MemberPage() {  // Changed from MembersPage
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/member');  // Changed from /api/members
        if (!response.ok) {
          throw new Error('Failed to fetch members');
        }
        const data = await response.json();
        setMembers(data);
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
              <MemberCard
                key={member._id}
                name={member.name}
                role={member.role}
                image={member.image || '/default-avatar.png'}
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