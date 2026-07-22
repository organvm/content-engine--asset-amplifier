import React from 'react';
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

interface RadarDimension {
  key: string;
  label: string;
  value: number;
}

interface RadarChartProps {
  dimensions: RadarDimension[];
  size?: number;
  selectedKey?: string | null;
  onSelect?: (key: string) => void;
}

export default function RadarChart({
  dimensions,
  size = 280,
  selectedKey: _selectedKey = null,
  onSelect,
}: RadarChartProps) {
  return (
    <div className="mx-auto" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="70%" data={dimensions}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis 
            dataKey="label" 
            tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 500 }}
            onClick={(props: { value?: string }) => {
              if (onSelect && props.value) {
                const dim = dimensions.find(d => d.label === props.value);
                if (dim) onSelect(dim.key);
              }
            }}
            style={{ cursor: onSelect ? 'pointer' : 'default' }}
          />
          <PolarRadiusAxis angle={30} domain={[0, 1]} tick={false} axisLine={false} />
          <Radar
            name="Identity"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="#3b82f6"
            fillOpacity={0.15}
            activeDot={{ r: 5, fill: '#2563eb', stroke: 'white', strokeWidth: 2 }}
            dot={{ r: 3, fill: '#3b82f6', stroke: 'white', strokeWidth: 2 }}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
