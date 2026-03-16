// frontend/src/components/chessgui/Clock.tsx
import React from 'react';

const formatTime = (ms: number): string => {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return (`${minutes}:${seconds.toString().padStart(2, '0')}`);
};

interface ClockProps {
  timeMs: number;
  isActive: boolean;
}

export const Clock: React.FC<ClockProps> = ({ timeMs, isActive }) => {
  const isCritical = timeMs < 30_000 && timeMs > 0;
  
  return (
    <div
      className={[
        'flex items-center justify-center px-4 py-2 rounded-lg transition-all duration-200 min-w-[90px] sm:min-w-[110px] h-full',
        isActive
          ? 'bg-secondary-hover text-text-default border-4 border-text-default'
          : 'bg-secondary text-text-default',
      ].join(' ')}
    >
      <span
        className={[
          'text-xl sm:text-2xl font-mono font-bold tabular-nums tracking-tight',
          isCritical ? 'text-red-500 animate-pulse' : '',
        ].join(' ')}
      >
        {formatTime(timeMs)}
      </span>
    </div>
  );
};