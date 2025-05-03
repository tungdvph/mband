'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { FaPlay, FaPause } from 'react-icons/fa';
import { FiInfo } from 'react-icons/fi'; // Icon cho nút chi tiết (tùy chọn)

interface MusicPlayerProps {
  title: string;
  artist: string;
  image?: string; // Ảnh là tùy chọn
  audio: string;
  description?: string; // Mô tả là tùy chọn
  onDetailsClick?: () => void; // Callback khi nhấn nút Xem chi tiết (TÙY CHỌN)
}

// Hàm định dạng thời gian (Giữ nguyên)
const formatTime = (timeInSeconds: number): string => {
  if (isNaN(timeInSeconds) || timeInSeconds < 0) {
    return '00:00';
  }
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export default function MusicPlayer({ title, artist, image, audio, description, onDetailsClick }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Handlers (Giữ nguyên logic)
  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };
  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };
  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      // Chỉ play nếu có duration hợp lệ (tránh lỗi khi file chưa load xong)
      if (audioRef.current.duration > 0 && isFinite(audioRef.current.duration)) {
        audioRef.current.play().catch(error => console.error("Error playing audio:", error));
      } else {
        console.warn("Audio not ready or invalid duration.");
      }
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]); // Bỏ audioRef khỏi dependency array vì nó là ref, không thay đổi

  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressBarRef.current || duration <= 0 || !isFinite(duration)) return;
    const progressBar = progressBarRef.current;
    const clickPositionX = event.clientX - progressBar.getBoundingClientRect().left;
    const barWidth = progressBar.offsetWidth;
    // Đảm bảo không chia cho 0 hoặc giá trị không hợp lệ
    if (barWidth > 0) {
      const seekTime = (clickPositionX / barWidth) * duration;
      if (isFinite(seekTime)) {
        audioRef.current.currentTime = seekTime;
        setCurrentTime(seekTime);
        // Nếu đang không phát, vẫn giữ trạng thái không phát
        // Nếu muốn tự động phát khi tua, thêm logic play() ở đây
      }
    }
  };

  // Sử dụng ảnh mặc định nếu không có ảnh
  const imageUrl = image || '/images/default-album-art.png'; // Thay bằng đường dẫn ảnh mặc định của bạn

  // --- ** Bắt đầu phần Render với UI cải tiến ** ---
  return (
    // Card Container - Cải thiện viền, nền, bóng đổ
    <div className="w-full bg-gradient-to-br from-white via-indigo-50 to-purple-50 rounded-xl shadow-lg border border-gray-200 p-4 transition-shadow hover:shadow-xl group">

      {/* Phần thông tin bài hát */}
      <div className="flex items-start sm:items-center gap-4 mb-4"> {/* Dùng gap thay space-x, items-start để nút chi tiết căn đẹp hơn */}
        {/* Ảnh bài hát - Thêm ring */}
        <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden shadow-md border border-gray-100 ring-1 ring-black ring-opacity-5">
          <img
            src={imageUrl}
            alt={`Bìa album ${title}`}
            className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
            onError={(e) => { (e.target as HTMLImageElement).src = '/images/default-album-art.png'; }}
            loading="lazy" // Thêm lazy loading cho ảnh
          />
        </div>
        {/* Tên, Nghệ sĩ, Mô tả, Nút chi tiết - Cải thiện typography */}
        <div className="flex-grow overflow-hidden min-w-0">
          {/* Title - Style đẹp hơn */}
          <h3
            className="text-lg sm:text-xl font-semibold text-indigo-800 truncate transition-colors duration-200"
            title={title}
          >
            {title || 'Chưa có tiêu đề'}
          </h3>
          {/* Artist - Style đẹp hơn */}
          <p className="text-sm text-indigo-600 font-medium truncate" title={artist}>
            {artist || 'Nghệ sĩ không xác định'}
          </p>
          {/* Description */}
          {description && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2" title={description}>
              {description}
            </p>
          )}
          {/* Nút Xem Chi Tiết (TÙY CHỌN) */}
          {onDetailsClick && (
            <button
              onClick={onDetailsClick}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 border border-indigo-300 text-indigo-600 rounded-full hover:bg-indigo-100 hover:border-indigo-400 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
              aria-label="Xem chi tiết"
            >
              <FiInfo size={12} />
              Chi tiết
            </button>
          )}
        </div>
      </div>

      {/* Phần điều khiển */}
      <div className="flex items-center gap-3"> {/* Dùng gap thay space-x */}
        {/* Nút Play/Pause - Giữ nguyên style đẹp sẵn */}
        <button
          onClick={togglePlay}
          className="flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-full p-3 shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 transform transition-all duration-200 ease-in-out hover:scale-105 active:scale-95" // Thêm active:scale-95
          aria-label={isPlaying ? 'Pause' : 'Play'}
          disabled={!isFinite(duration) || duration <= 0} // Vô hiệu hóa nút nếu chưa load xong nhạc
        >
          {isPlaying ? <FaPause size={14} /> : <FaPlay size={14} className="translate-x-[1px]" />} {/* Dịch icon Play sang phải chút */}
        </button>

        {/* Thời gian hiện tại - Màu đẹp hơn */}
        <span className="text-xs text-indigo-700 font-mono w-10 text-right flex-shrink-0 tabular-nums">
          {formatTime(currentTime)}
        </span>

        {/* Thanh Progress - To hơn, màu đẹp hơn */}
        <div
          ref={progressBarRef}
          className="flex-grow h-3 bg-indigo-100 rounded-full cursor-pointer group/progress relative" // Tăng chiều cao, đổi màu nền, thêm group riêng
          onClick={handleSeek}
          title="Tua nhạc" // Thêm title để biết có thể click
        >
          {/* Phần đã chạy - Gradient đẹp hơn */}
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full absolute left-0 top-0 bottom-0 transition-[width] duration-100 ease-linear" // Chỉ transition width
            style={{ width: duration > 0 && isFinite(duration) ? `${(currentTime / duration) * 100}%` : '0%' }}
          />
          {/* Chấm tròn (thumb) - To hơn, màu đậm hơn, hiệu ứng rõ hơn */}
          <div
            className="w-4 h-4 bg-indigo-700 rounded-full absolute top-1/2 transform -translate-y-1/2 opacity-0 group-hover/progress:opacity-100 group-hover/progress:scale-110 transition-all duration-150 ease-in-out pointer-events-none shadow-md" // To hơn, chỉ hiện khi hover thanh progress
            style={{ left: duration > 0 && isFinite(duration) ? `calc(${(currentTime / duration) * 100}% - 8px)` : '-8px' }} // Điều chỉnh offset (-8px ~ nửa width 16px)
          ></div>
        </div>

        {/* Tổng thời gian - Màu đẹp hơn */}
        <span className="text-xs text-indigo-700 font-mono w-10 text-left flex-shrink-0 tabular-nums">
          {/* Hiển thị --:-- nếu duration không hợp lệ */}
          {isFinite(duration) && duration > 0 ? formatTime(duration) : '--:--'}
        </span>
      </div>

      {/* Phần tử audio ẩn */}
      <audio
        ref={audioRef}
        src={audio}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
        preload="metadata" // Quan trọng để lấy duration sớm
        onError={(e) => console.error("Audio loading error:", e)} // Thêm error handler
      />
    </div>
  );
}