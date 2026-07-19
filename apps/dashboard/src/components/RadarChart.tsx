import React, { useMemo } from 'react';

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

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function buildPolygonPoints(
  cx: number,
  cy: number,
  maxR: number,
  values: number[],
  angleStep: number,
): string {
  return values
    .map((v, i) => {
      const r = v * maxR;
      const p = polarToCartesian(cx, cy, r, i * angleStep);
      return `${p.x},${p.y}`;
    })
    .join(' ');
}

export default function RadarChart({
  dimensions,
  size = 280,
  selectedKey = null,
  onSelect,
}: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 32;
  const n = dimensions.length;
  const angleStep = n > 0 ? 360 / n : 0;
  const rings = [0.25, 0.5, 0.75, 1.0];

  const dataPoints = useMemo(
    () => dimensions.map(d => d.value),
    [dimensions],
  );

  const dataPolygon = useMemo(
    () => buildPolygonPoints(cx, cy, maxR, dataPoints, angleStep),
    [cx, cy, maxR, dataPoints, angleStep],
  );

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full max-w-[320px] mx-auto"
      role="img"
      aria-label="Brand identity radar chart"
    >
      {/* Concentric rings */}
      {rings.map(r => {
        const ringPoints = Array.from({ length: n }, (_, i) => {
          const p = polarToCartesian(cx, cy, maxR * r, i * angleStep);
          return `${p.x},${p.y}`;
        }).join(' ');
        return (
          <polygon
            key={r}
            points={ringPoints}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={1}
          />
        );
      })}

      {/* Axis lines */}
      {dimensions.map((_, i) => {
        const p = polarToCartesian(cx, cy, maxR, i * angleStep);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={dataPolygon}
        fill="rgba(59, 130, 246, 0.15)"
        stroke="#3b82f6"
        strokeWidth={2}
      />

      {/* Data points */}
      {dimensions.map((d, i) => {
        const r = d.value * maxR;
        const p = polarToCartesian(cx, cy, r, i * angleStep);
        const labelP = polarToCartesian(cx, cy, maxR + 18, i * angleStep);
        const isSelected = d.key === selectedKey;

        return (
          <g
            key={d.key}
            onClick={() => onSelect?.(d.key)}
            className={onSelect ? 'cursor-pointer' : ''}
          >
            <circle
              cx={p.x}
              cy={p.y}
              r={isSelected ? 5 : 3}
              fill={isSelected ? '#2563eb' : '#3b82f6'}
              stroke="white"
              strokeWidth={2}
            />
            <text
              x={labelP.x}
              y={labelP.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[9px] font-medium fill-gray-500 select-none"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
