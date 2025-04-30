// src/components/ui/MusicPlayer.tsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
// Cài đặt react-icons: npm install react-icons
import { FaPlay, FaPause } from 'react-icons/fa'; // Icon Play/Pause

interface MusicPlayerProps {
  title: string;
  artist: string;
  image?: string; // Ảnh là tùy chọn
  audio: string;
  description?: string; // Mô tả là tùy chọn
}

// Hàm định dạng thời gian từ giây sang MM:SS
const formatTime = (timeInSeconds: number): string => {
  if (isNaN(timeInSeconds) || timeInSeconds < 0) {
    return '00:00';
  }
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export default function MusicPlayer({ title, artist, image, audio, description }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null); // Ref cho thanh progress để tính toán khi tua

  // Xử lý khi metadata của audio được tải (lấy duration)
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Xử lý khi thời gian audio thay đổi
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Xử lý khi audio kết thúc
  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0); // Reset về đầu khi kết thúc
  };

  // Toggle Play/Pause
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      // Đảm bảo các audio khác dừng lại nếu cần (logic phức tạp hơn, tạm bỏ qua)
      audioRef.current.play().catch(error => console.error("Error playing audio:", error));
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // Xử lý tua nhạc khi click vào thanh progress
  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressBarRef.current || duration <= 0) return;

    const progressBar = progressBarRef.current;
    // Lấy vị trí click tương đối so với thanh progress
    const clickPositionX = event.clientX - progressBar.getBoundingClientRect().left;
    const barWidth = progressBar.offsetWidth;
    // Tính toán thời gian mới dựa trên vị trí click
    const seekTime = (clickPositionX / barWidth) * duration;

    if (isFinite(seekTime)) {
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime); // Cập nhật state ngay lập tức cho mượt
    }
  };

  // Hiển thị ảnh mặc định nếu không có image prop
  const imageUrl = image || '/images/default-album-art.png'; // Thay bằng đường dẫn ảnh mặc định của bạn

  return (
    // Bỏ nền tối, để component trong suốt hòa vào card cha
    <div className="w-full">
      {/* Phần thông tin bài hát (Ảnh, Tên, Nghệ sĩ, Mô tả) */}
      <div className="flex items-center space-x-4 mb-4">
        {/* Ảnh bài hát */}
        <img
          src={imageUrl}
          alt={`Bìa album ${title}`}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover flex-shrink-0 shadow-md"
          // Thêm onError để xử lý ảnh lỗi nếu cần
          onError={(e) => { (e.target as HTMLImageElement).src = '/images/default-album-art.png'; }}
        />
        {/* Tên, Nghệ sĩ, Mô tả */}
        <div className="flex-grow overflow-hidden">
          <h3 className="text-lg font-semibold text-gray-800 truncate" title={title}>
            {title || 'Chưa có tiêu đề'}
          </h3>
          <p className="text-sm text-gray-500 truncate" title={artist}>
            {artist || 'Nghệ sĩ không xác định'}
          </p>
          {description && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2" title={description}>
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Phần điều khiển (Nút Play/Pause, Thanh Progress, Thời gian) */}
      <div className="flex items-center space-x-3">
        {/* Nút Play/Pause */}
        <button
          onClick={togglePlay}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150 ease-in-out flex-shrink-0"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <FaPause size={16} /> : <FaPlay size={16} />}
        </button>

        {/* Thời gian hiện tại */}
        <span className="text-xs text-gray-600 font-mono w-10 text-right flex-shrink-0">
          {formatTime(currentTime)}
        </span>

        {/* Thanh Progress */}
        <div
          ref={progressBarRef}
          className="flex-grow h-2 bg-gray-200 rounded-full cursor-pointer group relative"
          onClick={handleSeek}
        >
          <div
            className="bg-indigo-500 h-2 rounded-full absolute left-0 top-0 bottom-0"
            style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
          />
          {/* Chấm tròn ở cuối thanh progress (hiển thị khi hover) - tùy chọn */}
          <div
            className="w-3 h-3 bg-indigo-700 rounded-full absolute top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
            style={{ left: duration > 0 ? `calc(${(currentTime / duration) * 100}% - 6px)` : '-6px' }} // -6px để căn giữa chấm tròn
          ></div>
        </div>

        {/* Tổng thời gian */}
        <span className="text-xs text-gray-600 font-mono w-10 text-left flex-shrink-0">
          {formatTime(duration)}
        </span>
      </div>

      {/* Phần tử audio ẩn đi */}
      <audio
        ref={audioRef}
        src={audio}
        onLoadedMetadata={handleLoadedMetadata} // Lấy duration khi metadata sẵn sàng
        onTimeUpdate={handleTimeUpdate}      // Cập nhật currentTime
        onEnded={handleAudioEnded}          // Xử lý khi kết thúc
        preload="metadata"                  // Chỉ tải metadata ban đầu
      />
    </div>
  );
}