/**
 * Matrix Heatmap Component
 *
 * Displays 20×20 GSU relationship matrix as a color-coded heatmap.
 * Uses SVG for scalability with interactive tooltips.
 */

import React, { useState, useMemo } from 'react';

const MatrixHeatmap = ({ matrix, participants = [] }) => {
  const [hoveredCell, setHoveredCell] = useState(null);

  // Configuration
  const cellSize = 30;
  const labelWidth = 120;
  const labelHeight = 30;
  const padding = 10;

  const width = matrix[0].length * cellSize + labelWidth + padding * 2;
  const height = matrix.length * cellSize + labelHeight + padding * 2;

  // Color scale for 0-7 values
  const getColor = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'rgb(240, 240, 240)'; // Light gray for missing values
    }

    // Normalize to 0-1 range (0-7 scale)
    const normalized = Math.max(0, Math.min(1, value / 7));

    // Blue (low) to Red (high) gradient
    const r = Math.round(normalized * 220 + 35);
    const g = Math.round((1 - normalized) * 100 + 50);
    const b = Math.round((1 - normalized) * 220 + 35);

    return `rgb(${r}, ${g}, ${b})`;
  };

  // Get text color based on background
  const getTextColor = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '#666';
    }
    return value > 3.5 ? '#ffffff' : '#000000';
  };

  // Memoize participant labels
  const labels = useMemo(() => {
    return matrix.map((_, idx) =>
      participants[idx]?.name || `P${idx + 1}`
    );
  }, [matrix, participants]);

  return (
    <div className="relative">
      {/* Tooltip */}
      {hoveredCell && (
        <div
          className="absolute z-50 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm pointer-events-none"
          style={{
            left: hoveredCell.x + 10,
            top: hoveredCell.y - 40,
          }}
        >
          <div className="font-semibold">
            {labels[hoveredCell.row]} → {labels[hoveredCell.col]}
          </div>
          <div className="text-xs text-gray-300 mt-1">
            Value: {hoveredCell.value?.toFixed(2) || 'N/A'}
          </div>
        </div>
      )}

      {/* SVG Heatmap */}
      <svg
        width={width}
        height={height}
        className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
      >
        {/* Column labels (top) */}
        {labels.map((label, colIdx) => (
          <text
            key={`col-${colIdx}`}
            x={labelWidth + padding + colIdx * cellSize + cellSize / 2}
            y={padding + labelHeight - 5}
            textAnchor="middle"
            fontSize="10"
            fill="currentColor"
            className="text-gray-700 dark:text-gray-300"
            transform={`rotate(-45 ${labelWidth + padding + colIdx * cellSize + cellSize / 2} ${padding + labelHeight - 5})`}
          >
            {label.length > 12 ? label.slice(0, 10) + '...' : label}
          </text>
        ))}

        {/* Row labels (left) */}
        {labels.map((label, rowIdx) => (
          <text
            key={`row-${rowIdx}`}
            x={padding + labelWidth - 5}
            y={labelHeight + padding + rowIdx * cellSize + cellSize / 2 + 4}
            textAnchor="end"
            fontSize="10"
            fill="currentColor"
            className="text-gray-700 dark:text-gray-300"
          >
            {label.length > 15 ? label.slice(0, 13) + '...' : label}
          </text>
        ))}

        {/* Matrix cells */}
        {matrix.map((row, rowIdx) =>
          row.map((value, colIdx) => {
            const x = labelWidth + padding + colIdx * cellSize;
            const y = labelHeight + padding + rowIdx * cellSize;
            const isDiagonal = rowIdx === colIdx;

            return (
              <g key={`cell-${rowIdx}-${colIdx}`}>
                {/* Cell background */}
                <rect
                  x={x}
                  y={y}
                  width={cellSize}
                  height={cellSize}
                  fill={isDiagonal ? 'transparent' : getColor(value)}
                  stroke="#ffffff"
                  strokeWidth="1"
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onMouseEnter={(e) => {
                    if (!isDiagonal) {
                      setHoveredCell({
                        row: rowIdx,
                        col: colIdx,
                        value: value,
                        x: e.clientX,
                        y: e.clientY,
                      });
                    }
                  }}
                  onMouseLeave={() => setHoveredCell(null)}
                />

                {/* Cell value (optional - only show on larger cells) */}
                {cellSize >= 30 && !isDiagonal && (
                  <text
                    x={x + cellSize / 2}
                    y={y + cellSize / 2 + 4}
                    textAnchor="middle"
                    fontSize="9"
                    fill={getTextColor(value)}
                    className="pointer-events-none select-none"
                  >
                    {value?.toFixed(1) || '—'}
                  </text>
                )}

                {/* Diagonal marker */}
                {isDiagonal && (
                  <line
                    x1={x}
                    y1={y}
                    x2={x + cellSize}
                    y2={y + cellSize}
                    stroke="#cccccc"
                    strokeWidth="1"
                    className="pointer-events-none"
                  />
                )}
              </g>
            );
          })
        )}
      </svg>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">Low</span>
        <div className="flex gap-0">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((val) => (
            <div
              key={val}
              className="w-10 h-6 flex items-center justify-center text-xs"
              style={{
                backgroundColor: getColor(val),
                color: getTextColor(val),
              }}
            >
              {val}
            </div>
          ))}
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400">High</span>
      </div>
    </div>
  );
};

export default MatrixHeatmap;
