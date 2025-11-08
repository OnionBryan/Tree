import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { FiActivity, FiZap, FiCpu } from 'react-icons/fi';

const CustomNode = memo(({ data, selected }) => {
  const getIcon = () => {
    switch (data.nodeType) {
      case 'decision':
        return <FiActivity className="w-4 h-4" />;
      case 'probabilistic':
        return <FiZap className="w-4 h-4" />;
      case 'statistical':
        return <FiCpu className="w-4 h-4" />;
      default:
        return <FiActivity className="w-4 h-4" />;
    }
  };

  return (
    <div
      className={`px-4 py-3 bg-white border-2 rounded-lg shadow-md transition-all duration-200
        ${selected ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-300'}
        hover:shadow-lg hover:border-primary-400`}
      style={{ minWidth: '150px' }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-primary-500 border-2 border-white"
      />

      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="text-xs font-medium text-gray-600 uppercase">
            {data.nodeType}
          </span>
        </div>
      </div>

      <div className="font-semibold text-gray-800 text-sm">
        {data.label || 'Node'}
      </div>

      {data.description && (
        <div className="text-xs text-gray-500 mt-1">
          {data.description}
        </div>
      )}

      <div className="flex justify-between items-center mt-2">
        <div className="flex gap-1">
          {data.branchLabels && data.branchLabels.slice(0, 3).map((label, i) => (
            <span
              key={i}
              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
            >
              {label}
            </span>
          ))}
          {data.branchLabels && data.branchLabels.length > 3 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
              +{data.branchLabels.length - 3}
            </span>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-primary-500 border-2 border-white"
      />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';

export default CustomNode;