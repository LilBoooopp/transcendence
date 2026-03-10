// frontend/src/components/GameModeStatsCard.tsx
import React from 'react';
import { LineChart } from './charts/LineChart';
import { StatTrend } from './StatTrend';
import themeColors from '../themeColors';

interface GameModeStatsCardProps {
  title: string;
  icon: React.ReactNode;
  currentRating: number;
  ratingDelta: number;
  chartData: any[];
  chartColor?: string;
}

export const GameModeStatsCard: React.FC<GameModeStatsCardProps> = ({
  title,
  icon,
  currentRating,
  ratingDelta,
  chartData,
  chartColor = themeColors.primary.DEFAULT
}) => {
  return (
    <div className="bg-background-dark border-2 border-gray-800 rounded-2xl p-4 flex flex-row items-center gap-4 shadow-lg w-full">
      
      {/* Left Column: Icon and Stats */}
      {/* shrink-0 prevents this column from getting squished by the chart on very small screens */}
      <div className="flex flex-col justify-center items-start w-[140px] sm:w-1/3 shrink-0">
        
        {/* Title & Icon */}
        <div className="flex items-center gap-2 mb-2">
          {/* Reduced padding from p-3 to p-2 and rounded-xl to rounded-lg */}
          <div className="text-accent-DEFAULT p-2 bg-gray-800 rounded-lg">
            {icon}
          </div>
          {/* Reduced text size from text-2xl to text-lg */}
          <h3 className="text-lg font-heading font-bold text-text-default truncate">{title}</h3>
        </div>
        
        {/* Rating & Trend */}
        <div className="flex flex-col items-start">
          {/* Adjusted to a reasonable size (text-3xl) instead of 5xl */}
          <span className="text-3xl font-body font-black text-text-default leading-none">
            {currentRating}
          </span>
          {/* Shortened the label slightly so it fits better on narrow mobile screens */}
          <StatTrend delta={ratingDelta} label="vs last 30d" />
        </div>
      </div>

      {/* Right Column: The Line Chart */}
      {/* Removed the large min-h-[220px] and forced a much shorter height (h-28 = 112px) */}
      <div className="flex-grow w-full h-28">
        <LineChart 
          data={chartData}
          xAxisKey="date"
          height="100%" 
          series={[
            { dataKey: 'rating', name: 'Elo Rating', color: chartColor }
          ]}
        />
      </div>

    </div>
  );
};