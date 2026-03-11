import React from 'react';
import {
	LineChart as RechartsLineChart,
	Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { BaseChartProps } from './types';

export const LineChart: React.FC<BaseChartProps> = ({ 
	data, xAxisKey, series, height = 300, title 
}) => {

	return (
		<div className="w-full flex flex-col" style={{ height }}>
			{title && <h3 className="text-lg font-semibold text-text-default mb-4">{title}</h3>}
			
			<ResponsiveContainer width="100%" height="100%">
				<RechartsLineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
					<CartesianGrid strokeDasharray="3 3" stroke="#435646" />
					<XAxis dataKey={xAxisKey} stroke="#AEC3B0" />
					<YAxis stroke="#AEC3B0" />
					<Tooltip 
						contentStyle={{ 
							backgroundColor: '#01161e', 
							borderColor: '#124559', 
							color: '#eff6e0' 
						}}
						itemStyle={{ color: '#eff6e0' }}
					/>
					<Legend />

					{series.map((s, index) => (
						<Line
							key={index}
							type="monotone"
							dataKey={s.dataKey}
							name={s.name || s.dataKey}
							stroke={s.color || '#124559'} 
							strokeWidth={2}
							activeDot={{ r: 8 }}
						/>
					))}
				</RechartsLineChart>
			</ResponsiveContainer>
		</div>
	);
};