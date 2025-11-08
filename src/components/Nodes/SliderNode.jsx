import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

/**
 * SliderNode - Represents a slider/rating question input in logic flow
 * Based on Phase0 Slider type
 */
const SliderNode = memo(({ data, selected }) => {
  return (
    <div
      className={`relative flex flex-col items-center justify-center px-4 py-3 min-w-[120px] rounded-lg
        bg-green-100 border-2 border-green-500
        ${selected ? 'ring-4 ring-green-300' : ''}
        hover:shadow-lg transition-all duration-200`}
    >
      {/* Icon */}
      <div className="text-2xl mb-1">🎚️</div>

      {/* Label */}
      <div className="text-xs font-semibold text-green-900 text-center">
        {data.label || 'Slider/Rating'}
      </div>

      {/* Question Type Badge */}
      <div className="text-[10px] text-green-700 mt-1 px-2 py-0.5 bg-green-200 rounded-full">
        {data.questionType || 'slider'}
      </div>

      {/* Output Handle - numeric value flows out */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-green-500 border-2 border-green-700"
        style={{ right: '-6px' }}
      />
    </div>
  );
});

SliderNode.displayName = 'SliderNode';

export default SliderNode;
