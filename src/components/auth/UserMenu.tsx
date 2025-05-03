'use client';
import { useState, useEffect, useRef } from 'react'; // Import thêm useEffect và useRef
import { usePublicAuth } from '@/contexts/PublicAuthContext';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { FaChevronDown, FaHistory, FaUserCog, FaSignOutAlt } from 'react-icons/fa';

const UserMenu = () => {
  const { user } = usePublicAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Tạo refs cho nút bấm và dropdown
  const dropdownRef = useRef<HTMLDivElement>(null); // Ref cho div dropdown
  const buttonRef = useRef<HTMLButtonElement>(null); // Ref cho nút bấm

  // Effect để xử lý click bên ngoài
  useEffect(() => {
    // Hàm xử lý khi click
    const handleClickOutside = (event: MouseEvent) => {
      // Kiểm tra xem click có nằm ngoài nút bấm VÀ ngoài dropdown không
      if (
        isDropdownOpen && // Chỉ xử lý khi dropdown đang mở
        buttonRef.current && // Đảm bảo ref nút bấm tồn tại
        !buttonRef.current.contains(event.target as Node) && // Click không nằm trong nút bấm
        dropdownRef.current && // Đảm bảo ref dropdown tồn tại
        !dropdownRef.current.contains(event.target as Node) // Click không nằm trong dropdown
      ) {
        setIsDropdownOpen(false); // Đóng dropdown
      }
    };

    // Thêm event listener khi dropdown mở
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      // Gỡ listener nếu dropdown đóng (để tối ưu)
      document.removeEventListener('mousedown', handleClickOutside);
    }

    // Cleanup function: Gỡ bỏ event listener khi component unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]); // Dependency array: Chạy lại effect khi isDropdownOpen thay đổi

  return (
    // Thẻ div này không cần ref, vì chúng ta chỉ quan tâm đến nút bấm và panel dropdown
    <div className="relative">
      {/* Nút bấm mở Dropdown - Gán ref */}
      <button
        ref={buttonRef} // Gán ref cho nút bấm
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium text-white
                   bg-gray-700 border border-gray-600
                   hover:bg-gray-600
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white
                   transition ease-in-out duration-150"
        aria-haspopup="true"
        aria-expanded={isDropdownOpen}
        id="user-menu-button"
      >
        <span>{user?.username || 'User'}</span>
        <FaChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'transform rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu - Gán ref */}
      {isDropdownOpen && (
        <div
          ref={dropdownRef} // Gán ref cho div dropdown
          className="absolute right-0 mt-2 w-56 origin-top-right rounded-md shadow-xl bg-gray-800 ring-1 ring-gray-700 focus:outline-none z-50"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button"
        >
          <div className="py-1">
            {/* Các mục menu giữ nguyên */}
            <Link
              href="/booking/history"
              className="group flex items-center w-full px-4 py-2 text-sm text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors duration-150 ease-in-out"
              role="menuitem"
              onClick={() => setIsDropdownOpen(false)} // Vẫn giữ lại để đóng khi click vào item
            >
              <FaHistory className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-300" aria-hidden="true" />
              Lịch Sử Đặt Vé
            </Link>
            <Link
              href="/account"
              className="group flex items-center w-full px-4 py-2 text-sm text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors duration-150 ease-in-out"
              role="menuitem"
              onClick={() => setIsDropdownOpen(false)} // Vẫn giữ lại để đóng khi click vào item
            >
              <FaUserCog className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-300" aria-hidden="true" />
              Quản Lý Tài Khoản
            </Link>
            <hr className="border-gray-600 my-1" aria-hidden="true" />
            <button
              onClick={async () => {
                setIsDropdownOpen(false); // Vẫn giữ lại để đóng khi click vào item
                await signOut({ callbackUrl: '/', redirect: true });
              }}
              className="group flex items-center w-full px-4 py-2 text-sm text-red-400 rounded-md hover:bg-red-600 hover:text-white transition-colors duration-150 ease-in-out"
              role="menuitem"
            >
              <FaSignOutAlt className="mr-3 h-5 w-5 group-hover:text-white" aria-hidden="true" />
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;