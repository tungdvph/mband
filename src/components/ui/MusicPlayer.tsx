'use client';
import { useState, useRef } from 'react';

interface MusicPlayerProps {
  title: string;
  artist: string;
  image?: string;
  audio: string;
  description?: string;
}

export default function MusicPlayer({ title, artist, image, audio, description }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="bg-gray-900 p-4 rounded-lg">
      <div className="flex items-center space-x-4">
        <img src={image} alt={title} className="w-16 h-16 rounded" />
        <div>
          <h3 className="text-white font-semibold">{title}</h3>
          <p className="text-gray-400">{artist}</p>
        </div>
      </div>
      
      <div className="mt-4">
        <audio
          ref={audioRef}
          src={audio}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        />
        <button
          onClick={togglePlay}
          className="bg-red-600 text-white p-2 rounded-full"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <div className="mt-2 bg-gray-700 rounded-full h-1">
          <div
            className="bg-red-600 h-1 rounded-full"
            style={{ width: `${(currentTime / (audioRef.current?.duration || 1)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}