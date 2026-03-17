import React from 'react';
import { SimpleLineChart } from './charts/SimpleLineChart';
import { StatTrend } from './StatTrend';

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
  chartColor = '#124559'
}) => {
  return (
    <div className="bg-primary rounded-2xl p-4 sm:px-4 sm:py-0 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full h-auto sm:h-20 overflow-hidden shadow-sm">
      
      {/* Top Section (Mobile) / Left Section (Desktop) */}
      <div className="flex flex-row items-center justify-between w-full sm:w-auto sm:justify-start gap-4 sm:gap-6 shrink-0">
        
        {/* Icon */}
        <div className="flex items-center gap-3 shrink-0 pl-4">
          <div className="text-text-default transform scale-125">
            {icon}
          </div>
        </div>

        {/* Name & ELO */}
        <div className="flex flex-col justify-center items-center shrink-0">
          <h3 className="text-sm font-heading font-normal text-text-default">
            {title}
          </h3>
          <span className="-mt-1 text-2xl font-body font-black text-text-default">
            {currentRating}
          </span>
        </div>

        {/* Trend */}
        <div className="text-2xl flex items-center shrink-0 pr-4 sm:pr-8">
          <StatTrend delta={ratingDelta} label="" />
        </div>
      </div>

      {/* Chart */}
      <div className="w-full sm:w-auto flex-grow h-16 sm:h-full py-0 sm:py-2 min-w-[80px]">
        <SimpleLineChart 
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