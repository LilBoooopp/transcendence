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
		<div className="bg-secondary rounded-2xl px-4 flex flex-row items-center gap-6 w-full h-20 overflow-hidden shadow-sm">
			
			{/* Icon */}
			<div className="flex items-center gap-3 shrink-0">
				<div className="text-text-default transform scale-125">
					{icon}
				</div>
			</div>

			{/* Name & ELO */}
			<div className="flex flex-col justify-center items-center shrink-0 h-full">
				<h3 className="text-sm font-heading font-normal text-text-default">
					{title}
				</h3>
				<span className="-mt-2 text-2xl font-body font-black text-text-default">
					{currentRating}
				</span>
			</div>

			{/* Trend */}
			<div className="text-2xl flex items-center gap-3 shrink-0">
				<StatTrend delta={ratingDelta} label="" />
			</div>

			{/* Chart */}
			<div className="flex-grow h-full py-2 min-w-[80px]">
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