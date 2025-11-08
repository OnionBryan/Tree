import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

/**
 * CheckboxNode - Represents a checkbox/multi-select question input in logic flow
 * Based on Phase0 Checkbox type
 */
const CheckboxNode = memo(({ data, selected }) => {
  return (
    <div
      className={`relative flex flex-col items-center justify-center px-4 py-3 min-w-[120px] rounded-lg
        bg-orange-100 border-2 border-orange-500
        ${selected ? 'ring-4 ring-orange-300' : ''}
        hover:shadow-lg transition-all duration-200`}
    >
      {/* Icon */}
      <div className="text-2xl mb-1">✅</div>

      {/* Label */}
      <div className="text-xs font-semibold text-orange-900 text-center">
        {data.label || 'Checkbox'}
      </div>

      {/* Question Type Badge */}
      <div className="text-[10px] text-orange-700 mt-1 px-2 py-0.5 bg-orange-200 rounded-full">
        {data.questionType || 'checkbox'}
      </div>

      {/* Output Handle - array of selected values flows out */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-orange-500 border-2 border-orange-700"
        style={{ right: '-6px' }}
      />
    </div>
  );
});

CheckboxNode.displayName = 'CheckboxNode';

export default CheckboxNode;
