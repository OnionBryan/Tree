/**
 * Matrix Visualization Component
 *
 * Main component for displaying 20×20 GSU relationship matrices.
 * Provides multiple visualization modes (heatmap, network, table).
 */

import React, { useState } from 'react';
import { FiGrid, FiMap, FiTable } from 'react-icons/fi';
import MatrixHeatmap from './MatrixHeatmap.jsx';
import MatrixNetworkGraph from './MatrixNetworkGraph.jsx';

const MatrixVisualization = ({ matrix, metadata, participants = [] }) => {
  const [view, setView] = useState('heatmap'); // heatmap, network, table

  if (!matrix) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FiGrid className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>No matrix data available</p>
        <p className="text-sm mt-2">Generate a matrix from semantic differential responses</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            20×20 GSU Relationship Matrix
          </h3>
          {metadata && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Completeness: {Math.round(metadata.completeness * 100)}% •
              Density: {Math.round(metadata.density * 100)}% •
              Generated: {new Date(metadata.timestamp).toLocaleString()}
            </p>
          )}
        </div>

        {/* View Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setView('heatmap')}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              view === 'heatmap'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <FiMap className="w-4 h-4" />
            Heatmap
          </button>
          <button
            onClick={() => setView('network')}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              view === 'network'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <FiGrid className="w-4 h-4" />
            Network
          </button>
          <button
            onClick={() => setView('table')}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              view === 'table'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <FiTable className="w-4 h-4" />
            Table
          </button>
        </div>
      </div>

      {/* Visualization */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        {view === 'heatmap' && <MatrixHeatmap matrix={matrix} participants={participants} />}
        {view === 'network' && <MatrixNetworkGraph matrix={matrix} participants={participants} />}
        {view === 'table' && <MatrixTable matrix={matrix} participants={participants} />}
      </div>
    </div>
  );
};

/**
 * Table view of matrix
 */
const MatrixTable = ({ matrix, participants }) => {
  return (
    <div className="overflow-auto max-h-96">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-gray-100 dark:bg-gray-900">
          <tr>
            <th className="p-2 text-left">From \ To</th>
            {matrix[0].map((_, colIdx) => (
              <th key={colIdx} className="p-2 text-center">
                {participants[colIdx]?.name || `P${colIdx + 1}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, rowIdx) => (
            <tr key={rowIdx} className="border-t border-gray-200 dark:border-gray-700">
              <td className="p-2 font-medium bg-gray-50 dark:bg-gray-900">
                {participants[rowIdx]?.name || `P${rowIdx + 1}`}
              </td>
              {row.map((value, colIdx) => (
                <td
                  key={colIdx}
                  className="p-2 text-center"
                  style={{
                    backgroundColor:
                      rowIdx === colIdx
                        ? 'transparent'
                        : `rgba(37, 99, 235, ${value / 7 * 0.8})`,
                    color: value > 3.5 ? 'white' : 'inherit',
                  }}
                >
                  {rowIdx === colIdx ? '—' : value.toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MatrixVisualization;
