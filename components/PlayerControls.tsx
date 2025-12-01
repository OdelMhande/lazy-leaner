import React, { useRef } from 'react';
import { PlayIcon, PauseIcon, ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

interface PlayerControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onDownload: () => void;
  onReplay: () => void; // Reset to 0 and play
  hasAudio: boolean;
}

const formatTime = (seconds: number) => {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onSeek,
  onDownload,
  onReplay,
  hasAudio
}) => {
  if (!hasAudio) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  return (
    <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4 animate-fade-in">
      {/* Top Row: Main Controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onPlayPause}
            className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-sm"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <PauseIcon className="w-5 h-5" />
            ) : (
              <PlayIcon className="w-5 h-5 ml-0.5" />
            )}
          </button>
          
          <button
            onClick={onReplay}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
            title="Restart"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="text-sm font-medium text-slate-500 tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        <button
          onClick={onDownload}
          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
          title="Download Audio"
        >
          <ArrowDownTrayIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom Row: Scrubber */}
      <div className="relative w-full h-4 flex items-center group">
        <div className="absolute w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 rounded-full transition-all duration-100 ease-linear"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.1"
          value={currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="absolute w-full h-full opacity-0 cursor-pointer z-10"
        />
        {/* Thumb indicator (visual only) */}
        <div 
          className="absolute h-3.5 w-3.5 bg-white border-2 border-indigo-600 rounded-full shadow-md pointer-events-none transition-all duration-100 ease-linear"
          style={{ left: `calc(${progress}% - 7px)` }}
        />
      </div>
    </div>
  );
};

export default PlayerControls;