// src/components/auth/UserMenu.tsx

'use client';
import { useState, useEffect, useRef } from 'react';
import { usePublicAuth } from '@/contexts/PublicAuthContext';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { FaChevronDown, FaHistory, FaUserCog, FaSignOutAlt } from 'react-icons/fa';

// BƯỚC 1: Định nghĩa kiểu cho props, trong đó `closeMobileMenu` là một hàm tùy chọn
type UserMenuProps = {
  closeMobileMenu?: () => void;
};

const UserMenu = ({ closeMobileMenu }: UserMenuProps) => {
  const { user } = usePublicAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Effect để xử lý click bên ngoài (giữ nguyên, code này đã rất tốt)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isDropdownOpen &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // BƯỚC 2: Tạo một hàm chung để xử lý khi một mục trong menu được click
  const handleItemClick = () => {
    // Luôn đóng dropdown của UserMenu
    setIsDropdownOpen(false);
    // Nếu hàm `closeMobileMenu` được truyền vào (tức là đang ở giao diện mobile), thì gọi nó để đóng menu cha
    if (closeMobileMenu) {
      closeMobileMenu();
    }
  };

  // BƯỚC 3: Tạo hàm riêng cho việc đăng xuất để kết hợp cả hai hành động
  const handleSignOut = async () => {
    handleItemClick(); // Gọi hàm chung để đóng tất cả menu
    await signOut({ callbackUrl: '/', redirect: true });
  };


  return (
    <div className="relative">
      <button
        ref={buttonRef}
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

      {isDropdownOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-56 origin-top-right rounded-md shadow-xl bg-gray-800 ring-1 ring-gray-700 focus:outline-none z-50"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button"
        >
          <div className="py-1">
            <Link
              href="/booking/history"
              className="group flex items-center w-full px-4 py-2 text-sm text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors duration-150 ease-in-out"
              role="menuitem"
              onClick={handleItemClick} // BƯỚC 4: Sử dụng hàm chung
            >
              <FaHistory className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-300" aria-hidden="true" />
              Lịch Sử Đặt Vé
            </Link>
            <Link
              href="/account"
              className="group flex items-center w-full px-4 py-2 text-sm text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors duration-150 ease-in-out"
              role="menuitem"
              onClick={handleItemClick} // BƯỚC 4: Sử dụng hàm chung
            >
              <FaUserCog className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-300" aria-hidden="true" />
              Quản Lý Tài Khoản
            </Link>
            <hr className="border-gray-600 my-1" aria-hidden="true" />
            <button
              onClick={handleSignOut} // BƯỚC 4: Sử dụng hàm đăng xuất riêng
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