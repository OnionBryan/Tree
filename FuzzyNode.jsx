import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { FiTrendingUp } from 'react-icons/fi';

const FuzzyNode = memo(({ data, selected }) => {
  const getFuzzySymbol = () => {
    switch (data.logicType) {
      case 'fuzzy_min': return 'MIN';
      case 'fuzzy_max': return 'MAX';
      case 'fuzzy_average':
      case 'fuzzy_avg': return 'AVG';
      case 'fuzzy_product': return 'PROD';
      case 'fuzzy_sum': return 'SUM';
      default: return 'FUZZY';
    }
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center w-24 h-24 rounded-full
        bg-gradient-to-br from-purple-500 to-purple-700
        ${selected ? 'ring-4 ring-purple-300' : ''}
        hover:scale-110 transition-all duration-200 shadow-xl text-white`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-white border-2 border-purple-800"
      />

      <FiTrendingUp className="w-5 h-5 mb-1" />
      <div className="font-bold text-sm">{getFuzzySymbol()}</div>

      {data.metadata?.fuzzyThreshold && (
        <div className="text-xs opacity-80 mt-1">
          θ={data.metadata.fuzzyThreshold.toFixed(2)}
        </div>
      )}

      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2
        text-xs font-semibold text-gray-700 bg-white px-2 py-0.5 rounded shadow">
        {data.label || 'Fuzzy'}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-white border-2 border-purple-800"
      />
    </div>
  );
});

FuzzyNode.displayName = 'FuzzyNode';

export default FuzzyNode;