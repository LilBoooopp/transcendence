import React, { useMemo } from 'react';
import {
	LineChart as RechartsLineChart,
	Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { BaseChartProps } from './types';

export const SimpleLineChart: React.FC<BaseChartProps> = ({ 
	data, xAxisKey, series, height = 100
}) => {

	const { yDomain, yTicks } = useMemo(() => {
		if (!data || data.length === 0 || !series || series.length === 0) {
			return { yDomain: ['auto', 'auto'], yTicks: undefined };
		}
		
		const allValues = data.flatMap(item => 
			series.map(s => Number(item[s.dataKey]))
		).filter(val => !isNaN(val));

		if (allValues.length === 0) {
			return { yDomain: ['auto', 'auto'], yTicks: undefined };
		}

		const min = Math.min(...allValues);
		const max = Math.max(...allValues);
		
		const range = max - min;
		const buffer = range === 0 ? 10 : Math.ceil(range * 0.15); 
		const yMin = Math.max(0, min - buffer); 
		const yMax = max + buffer;

		return {
			yDomain: [yMin, yMax],
			yTicks: [yMin, yMax]
		};
	}, [data, series]);

	return (
		<div className="w-full flex flex-col" style={{ height }}>
			<ResponsiveContainer width="100%" height="100%">
				<RechartsLineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
					
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
						width={35}
						domain={yDomain}
						ticks={yTicks}
						interval={0}
						allowDecimals={false}
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