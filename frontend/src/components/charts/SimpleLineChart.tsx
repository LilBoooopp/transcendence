import React, { useMemo } from 'react';
import {
	LineChart as RechartsLineChart,
	Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { BaseChartProps } from './types';

export const SimpleLineChart: React.FC<BaseChartProps> = ({ 
	data, xAxisKey, series, height = 100
}) => {

	const yTicks = useMemo(() => {
		if (!data || data.length === 0 || !series || series.length === 0) return undefined;
		
		const allValues = data.flatMap(item => 
			series.map(s => Number(item[s.dataKey]))
		).filter(val => !isNaN(val));

		if (allValues.length === 0) return undefined;

		const min = Math.min(...allValues);
		const max = Math.max(...allValues);
		
		return min === max ? [min] : [min, max];
	}, [data, series]);

	return (
		<div className="w-full flex flex-col" style={{ height }}>
			<ResponsiveContainer width="100%" height="100%">
				{/* 1. Reset the left margin to 0 to stop horizontal clipping, and added top margin so the max number doesn't clip the ceiling */}
				<RechartsLineChart data={data} margin={{ top: 10, right: 5, left: 0, bottom: 0 }}>
					
					<XAxis 
						dataKey={xAxisKey} 
						stroke="#AEC3B0" 
						axisLine={false}
						tickLine={false}
						tick={{ fontSize: 10 }}
						minTickGap={30}
						tickMargin={5}
					/>
					<YAxis 
						stroke="#AEC3B0" 
						axisLine={false}
						tickLine={false}
						tick={{ fontSize: 10 }}
						width={35} // Optimized width for a 4-digit Elo number (e.g., 1200)
						domain={['dataMin', 'dataMax']} 
						ticks={yTicks} 
						interval={0} // 2. Forces Recharts to draw ALL ticks in the array, preventing it from hiding the second number on small screens
						allowDecimals={false}
						padding={{ top: 10, bottom: 10 }} // 3. Pushes the top and bottom of the line inward so the text fits comfortably
					/>
	
					<Tooltip 
						contentStyle={{ 
							backgroundColor: '#01161e', 
							borderColor: '#124559', 
							color: '#eff6e0',
							fontSize: '12px',
							padding: '4px 8px',
							borderRadius: '4px' 
						}}
						itemStyle={{ color: '#eff6e0', fontSize: '12px' }}
						cursor={{ stroke: '#AEC3B0', strokeWidth: 0.5, strokeDasharray: '3 3' }} 
					/>

					{series.map((s, index) => (
						<Line
							key={index}
							type="monotone"
							dataKey={s.dataKey}
							name={s.name || s.dataKey}
							stroke={s.color || '#124559'} 
							strokeWidth={2.5} 
							dot={false}
							activeDot={{ r: 4 }} 
						/>
					))}
				</RechartsLineChart>
			</ResponsiveContainer>
		</div>
	);
};