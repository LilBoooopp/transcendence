// frontend/src/components/charts/LineChart.tsx
import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { BaseChartProps } from './types';
import themeColors from '../../themeColors'; // Adjust path if needed

export const LineChart: React.FC<BaseChartProps> = ({ 
  data, xAxisKey, series, height = 300, title 
}) => {

  return (
    <div className="w-full flex flex-col" style={{ height }}>
      {/* Used your Tailwind class text-text-default here */}
      {title && <h3 className="text-lg font-semibold text-text-default mb-4">{title}</h3>}
      
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          
          {/* Grid styled with your Secondary CD color */}
          <CartesianGrid strokeDasharray="3 3" stroke={themeColors.secondary.DEFAULT} />
          
          {/* Axes styled with your Accent CD color */}
          <XAxis dataKey={xAxisKey} stroke={themeColors.accent.DEFAULT} />
          <YAxis stroke={themeColors.accent.DEFAULT} />
  
          {/* Tooltip styled with your specific Dark Mode Backgrounds */}
          <Tooltip 
            contentStyle={{ 
              backgroundColor: themeColors.background.dark, 
              borderColor: themeColors.primary.DEFAULT, 
              color: themeColors.text.default 
            }}
            itemStyle={{ color: themeColors.text.default }}
          />
          <Legend />

          {series.map((s, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={s.dataKey}
              name={s.name || s.dataKey}
              stroke={s.color || themeColors.primary.DEFAULT} 
              strokeWidth={2}
              activeDot={{ r: 8 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};