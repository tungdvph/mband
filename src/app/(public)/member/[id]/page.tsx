'use client';
import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Member } from '@/types/member';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function MemberDetailPage({ params }: { params: { id: string } }) {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const response = await fetch(`/api/member/${params.id}`);
        if (!response.ok) {
          throw new Error('Không thể tải thông tin thành viên');
        }
        const data = await response.json();
        setMember(data);
      } catch (error) {
        console.error('Error fetching member:', error);
        setError('Không thể tải thông tin thành viên');
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [params.id]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">Đang tải...</div>
        </div>
      </Layout>
    );
  }

  if (error || !member) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="text-center text-red-600">{error || 'Không tìm thấy thành viên'}</div>
          <div className="text-center mt-4">
            <Link href="/member">
              <Button variant="primary">Quay lại danh sách</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="mb-6">
          <Link href="/member">
            <span className="text-red-600 hover:text-red-700">← Quay lại danh sách</span>
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/3">
              <img 
                src={member.image || '/default-member.png'} 
                alt={member.name} 
                className="w-full h-96 object-cover"
              />
            </div>
            <div className="md:w-2/3 p-6">
              <h1 className="text-3xl font-bold mb-2">{member.name}</h1>
              <p className="text-red-600 text-xl mb-4">{member.role}</p>
              
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Giới thiệu</h2>
                <p className="text-gray-700 whitespace-pre-line">{member.description || 'Chưa có thông tin giới thiệu.'}</p>
              </div>
              
              {member.socialLinks && Object.keys(member.socialLinks).length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-2">Liên kết mạng xã hội</h2>
                  <div className="flex space-x-4">
                    {member.socialLinks.facebook && (
                      <a 
                        href={member.socialLinks.facebook} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-red-600"
                      >
                        Facebook
                      </a>
                    )}
                    {member.socialLinks.instagram && (
                      <a 
                        href={member.socialLinks.instagram} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-red-600"
                      >
                        Instagram
                      </a>
                    )}
                    {member.socialLinks.twitter && (
                      <a 
                        href={member.socialLinks.twitter} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-red-600"
                      >
                        Twitter
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}