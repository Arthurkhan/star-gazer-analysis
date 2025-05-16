
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PieChartRendererProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  colors?: string[];
  innerRadius?: number;
  outerRadius?: number;
  className?: string;
}

export const PieChartRenderer: React.FC<PieChartRendererProps> = ({
  data,
  colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'],
  innerRadius = 0,
  outerRadius = 80,
  className,
}) => {
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={500}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className={className || 'w-full h-64'}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [value, 'Count']} 
            labelFormatter={(label) => `${label}`}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
