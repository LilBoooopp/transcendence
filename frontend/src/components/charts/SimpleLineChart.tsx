import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { BaseChartProps } from './types';
import themeColors from '../../themeColors';

export const SimpleLineChart: React.FC<BaseChartProps> = ({ 
  data, xAxisKey, series, height = 100
}) => {
  return (
    <div className="w-full flex flex-col" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
          
          {/* Axes simplified: no lines, just small labels */}
          <XAxis 
            dataKey={xAxisKey} 
            stroke={themeColors.accent.DEFAULT} 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10 }}
          />
          <YAxis 
            stroke={themeColors.accent.DEFAULT} 
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
              backgroundColor: themeColors.background.dark, 
              borderColor: themeColors.primary.DEFAULT, 
              color: themeColors.text.default,
              fontSize: '12px',
              padding: '4px 8px'
            }}
            itemStyle={{ color: themeColors.text.default, fontSize: '12px' }}
            cursor={{ stroke: themeColors.accent.DEFAULT, strokeWidth: 0.5 }}
          />

          {series.map((s, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={s.dataKey}
              name={s.name || s.dataKey}
              stroke={s.color || themeColors.primary.DEFAULT} 
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