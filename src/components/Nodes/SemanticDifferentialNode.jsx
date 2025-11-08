import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

/**
 * SemanticDifferentialNode - Represents a semantic differential scale question in logic flow
 * Based on Phase0 SemanticDifferential type
 */
const SemanticDifferentialNode = memo(({ data, selected }) => {
  return (
    <div
      className={`relative flex flex-col items-center justify-center px-4 py-3 min-w-[120px] rounded-lg
        bg-pink-100 border-2 border-pink-500
        ${selected ? 'ring-4 ring-pink-300' : ''}
        hover:shadow-lg transition-all duration-200`}
    >
      {/* Icon */}
      <div className="text-2xl mb-1">⚖️</div>

      {/* Label */}
      <div className="text-xs font-semibold text-pink-900 text-center">
        {data.label || 'Semantic Scale'}
      </div>

      {/* Question Type Badge */}
      <div className="text-[10px] text-pink-700 mt-1 px-2 py-0.5 bg-pink-200 rounded-full">
        {data.questionType || 'semantic_differential'}
      </div>

      {/* Output Handle - scale value flows out */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-pink-500 border-2 border-pink-700"
        style={{ right: '-6px' }}
      />
    </div>
  );
});

SemanticDifferentialNode.displayName = 'SemanticDifferentialNode';

export default SemanticDifferentialNode;
