'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation'; // Import useParams hook
import Layout from '@/components/layout/Layout';
import { Member } from '@/types/member'; // Đảm bảo bạn có định nghĩa kiểu này
import Link from 'next/link';
import Button from '@/components/ui/Button'; // Đảm bảo bạn có component Button

// Component không còn nhận params qua props nữa
export default function MemberDetailPage() {
  const paramsHook = useParams(); // Sử dụng hook để lấy params
  const id = paramsHook.id as string; // Lấy id từ hook

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMember = async () => {
      // Kiểm tra nếu có id mới thực hiện fetch
      if (!id) {
        setError("Không tìm thấy ID thành viên.");
        setLoading(false);
        return;
      }

      setLoading(true); // Bắt đầu loading
      setError(null);   // Reset lỗi cũ
      try {
        // Sử dụng id lấy từ hook
        const response = await fetch(`/api/member/${id}`);
        if (!response.ok) {
          let errorMsg = 'Không thể tải thông tin thành viên';
          try {
            const errData = await response.json();
            errorMsg = errData.message || errData.error || errorMsg;
          } catch (e) { /* Bỏ qua lỗi parse json */ }
          throw new Error(errorMsg);
        }
        const data: Member = await response.json();
        setMember(data);
      } catch (error: any) {
        console.error('Error fetching member:', error);
        setError(error.message || 'Đã xảy ra lỗi khi tải dữ liệu.');
      } finally {
        setLoading(false); // Kết thúc loading
      }
    };

    fetchMember();
  }, [id]); // Dependency là id lấy từ hook

  // === Phần Render ===

  // Trạng thái Loading
  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">Đang tải...</div>
      </Layout>
    );
  }

  // Trạng thái Lỗi hoặc Không tìm thấy thành viên
  if (error || !member) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="text-center text-red-500">{error || 'Không tìm thấy thành viên'}</div>
          <div className="text-center mt-4">
            <Link href="/member">
              {/* Đảm bảo Button nhận prop variant */}
              <Button variant="primary">Quay lại danh sách</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // Hiển thị chi tiết thành viên khi có dữ liệu
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        {/* Nút quay lại */}
        <div className="mb-6">
          <Link href="/member" className="text-red-600 hover:text-red-700 inline-flex items-center">
            {/* Có thể thêm icon mũi tên nếu muốn */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Quay lại danh sách
          </Link>
        </div>

        {/* Khung chi tiết */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="md:flex">
            {/* Phần ảnh */}
            <div className="md:flex-shrink-0 md:w-1/3">
              <img
                src={member.image || '/img/default-avatar.png'} // Cập nhật đường dẫn ảnh mặc định nếu cần
                alt={member.name || 'Ảnh thành viên'}
                className="w-full h-auto object-cover" // Điều chỉnh chiều cao ảnh
              />
            </div>
            {/* Phần thông tin */}
            <div className="p-6 md:w-2/3">
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">{member.name}</h1>
              <p className="text-red-600 text-xl mb-4">{member.role}</p>

              {/* Phần giới thiệu */}
              <div className="mb-6 prose max-w-none"> {/* Sử dụng lớp prose nếu muốn định dạng markdown/html */}
                <h2 className="text-xl font-semibold mb-2">Giới thiệu</h2>
                <p className="text-gray-700 whitespace-pre-line">{member.description || 'Chưa có thông tin giới thiệu.'}</p>
                {/* Hoặc nếu description là HTML:
                 <div dangerouslySetInnerHTML={{ __html: member.description || '<p>Chưa có thông tin.</p>' }} />
                 */}
              </div>

              {/* Phần liên kết mạng xã hội */}
              {member.socialLinks && Object.keys(member.socialLinks).length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h2 className="text-xl font-semibold mb-2">Kết nối</h2>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {/* Lặp qua các link và hiển thị */}
                    {Object.entries(member.socialLinks)
                      .filter(([key, value]) => value) // Lọc những link có giá trị
                      .map(([key, value]) => (
                        <a
                          key={key}
                          href={value as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-red-700 capitalize inline-flex items-center"
                          aria-label={`Link ${key} của ${member.name}`} // Thêm aria-label
                        >
                          {/* Có thể thêm icon tương ứng */}
                          {key}
                        </a>
                      ))}
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