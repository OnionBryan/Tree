import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

/**
 * MultipleChoiceNode - Represents a multiple choice question input in logic flow
 * Based on Phase0 MultipleChoice type
 */
const MultipleChoiceNode = memo(({ data, selected }) => {
  return (
    <div
      className={`relative flex flex-col items-center justify-center px-4 py-3 min-w-[120px] rounded-lg
        bg-purple-100 border-2 border-purple-500
        ${selected ? 'ring-4 ring-purple-300' : ''}
        hover:shadow-lg transition-all duration-200`}
    >
      {/* Icon */}
      <div className="text-2xl mb-1">☑️</div>

      {/* Label */}
      <div className="text-xs font-semibold text-purple-900 text-center">
        {data.label || 'Multiple Choice'}
      </div>

      {/* Question Type Badge */}
      <div className="text-[10px] text-purple-700 mt-1 px-2 py-0.5 bg-purple-200 rounded-full">
        {data.questionType || 'choice'}
      </div>

      {/* Output Handle - selected choice flows out */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-purple-500 border-2 border-purple-700"
        style={{ right: '-6px' }}
      />
    </div>
  );
});

MultipleChoiceNode.displayName = 'MultipleChoiceNode';

export default MultipleChoiceNode;
