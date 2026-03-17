import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatTrendProps {
  delta: number;      // The change in value (e.g., 24, -12, 0)
  label?: string;     // Optional text to show next to it (e.g., "this week")
}

export const StatTrend: React.FC<StatTrendProps> = ({ delta, label }) => {
  const isPositive = delta > 0;
  const isNegative = delta < 0;

  // Set default colors (Neutral)
  let colorClass = 'text-gray-500';
  let Icon = Minus;

  // Change based on the delta value
  if (isPositive) {
    colorClass = 'text-green-500'; // Or use your themeColors.accent.DEFAULT
    Icon = TrendingUp;
  } else if (isNegative) {
    colorClass = 'text-red-500';
    Icon = TrendingDown;
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-1 font-bold ${colorClass}`}>
        <Icon size={20} strokeWidth={3} />
        <span>{Math.abs(delta)}</span> {/* Math.abs hides the minus sign so the arrow does the talking */}
      </div>
      {label && <span className="text-gray-400 text-sm font-medium">{label}</span>}
    </div>
  );
};
