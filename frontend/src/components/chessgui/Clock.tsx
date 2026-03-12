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
  label: string;
  isActive: boolean;
}

export const Clock: React.FC<ClockProps> = ({ timeMs, label, isActive }) => {
  const isCritical = timeMs < 30_000 && timeMs > 0;
  return (
    <div
      className={[
        'flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200',
        isActive
          ? 'bg-primary text-text-default shadow-md'
          : 'bg-accent/30 text-text-dark',
      ].join(' ')}
    >
      <span className={`text-xs font-body font-medium uppercase tracking-wider ${isActive ? 'text-accent' : 'text-text-dark/50'}`}>
        {label}
      </span>
      <span
        className={[
          'text-xl font-mono font-bold tabular-nums tracking-tight',
          isCritical ? 'text-red-500' : '',
        ].join(' ')}
      >
        {formatTime(timeMs)}
      </span>
    </div>
  );
};