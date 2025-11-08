import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

/**
 * ComboNode - Represents a combo question (combined text + choice) in logic flow
 * Based on Phase0 Combo type
 */
const ComboNode = memo(({ data, selected }) => {
  return (
    <div
      className={`relative flex flex-col items-center justify-center px-4 py-3 min-w-[120px] rounded-lg
        bg-cyan-100 border-2 border-cyan-500
        ${selected ? 'ring-4 ring-cyan-300' : ''}
        hover:shadow-lg transition-all duration-200`}
    >
      {/* Icon */}
      <div className="text-2xl mb-1">🎛️</div>

      {/* Label */}
      <div className="text-xs font-semibold text-cyan-900 text-center">
        {data.label || 'Combo Input'}
      </div>

      {/* Question Type Badge */}
      <div className="text-[10px] text-cyan-700 mt-1 px-2 py-0.5 bg-cyan-200 rounded-full">
        {data.questionType || 'combo'}
      </div>

      {/* Output Handle - combined value flows out */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-cyan-500 border-2 border-cyan-700"
        style={{ right: '-6px' }}
      />
    </div>
  );
});

ComboNode.displayName = 'ComboNode';

export default ComboNode;
