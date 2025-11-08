import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

/**
 * TextInputNode - Represents a text/textarea question input in logic flow
 * Based on Phase0 TextQuestion type
 */
const TextInputNode = memo(({ data, selected }) => {
  return (
    <div
      className={`relative flex flex-col items-center justify-center px-4 py-3 min-w-[120px] rounded-lg
        bg-blue-100 border-2 border-blue-500
        ${selected ? 'ring-4 ring-blue-300' : ''}
        hover:shadow-lg transition-all duration-200`}
    >
      {/* Icon */}
      <div className="text-2xl mb-1">📝</div>

      {/* Label */}
      <div className="text-xs font-semibold text-blue-900 text-center">
        {data.label || 'Text Input'}
      </div>

      {/* Question Type Badge */}
      <div className="text-[10px] text-blue-700 mt-1 px-2 py-0.5 bg-blue-200 rounded-full">
        {data.questionType || 'text'}
      </div>

      {/* Output Handle - text value flows out */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500 border-2 border-blue-700"
        style={{ right: '-6px' }}
      />
    </div>
  );
});

TextInputNode.displayName = 'TextInputNode';

export default TextInputNode;
