import React from 'react';
import {
	LineChart as RechartsLineChart,
	Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { BaseChartProps } from './types';

export const SimpleLineChart: React.FC<BaseChartProps> = ({ 
	data, xAxisKey, series, height = 100
}) => {
	return (
		<div className="w-full flex flex-col" style={{ height }}>
			<ResponsiveContainer width="100%" height="100%">
				<RechartsLineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
					
					<XAxis 
						dataKey={xAxisKey} 
						stroke="#AEC3B0" 
						axisLine={false}
						tickLine={false}
						tick={{ fontSize: 10 }}
						interval={4}
					/>
					<YAxis 
						stroke="#AEC3B0" 
						axisLine={false}
						tickLine={false}
						tick={{ fontSize: 10 }}
						width={30}
						domain={['auto', 'auto']}
						allowDecimals={false}
						padding={{ top: 10, bottom: 10 }}
					/>
	
					<Tooltip 
						contentStyle={{ 
							backgroundColor: '#01161e', 
							borderColor: '#124559', 
							color: '#eff6e0',
							fontSize: '12px',
							padding: '4px 8px'
						}}
						itemStyle={{ color: '#eff6e0', fontSize: '12px' }}
						cursor={{ stroke: '#AEC3B0', strokeWidth: 0.5 }}
					/>

					{series.map((s, index) => (
						<Line
							key={index}
							type="monotone"
							dataKey={s.dataKey}
							name={s.name || s.dataKey}
							stroke={s.color || '#124559'} 
							strokeWidth={3}
							dot={false}
							activeDot={{ r: 6 }}
						/>
					))}
				</RechartsLineChart>
			</ResponsiveContainer>
		</div>
	);
};