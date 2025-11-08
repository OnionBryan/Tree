import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

/**
 * MatrixNode - Represents a matrix/grid question input in logic flow
 * Based on Phase0 Matrix type
 */
const MatrixNode = memo(({ data, selected }) => {
  return (
    <div
      className={`relative flex flex-col items-center justify-center px-4 py-3 min-w-[120px] rounded-lg
        bg-amber-100 border-2 border-amber-500
        ${selected ? 'ring-4 ring-amber-300' : ''}
        hover:shadow-lg transition-all duration-200`}
    >
      {/* Icon */}
      <div className="text-2xl mb-1">⊞</div>

      {/* Label */}
      <div className="text-xs font-semibold text-amber-900 text-center">
        {data.label || 'Matrix Grid'}
      </div>

      {/* Question Type Badge */}
      <div className="text-[10px] text-amber-700 mt-1 px-2 py-0.5 bg-amber-200 rounded-full">
        {data.questionType || 'matrix'}
      </div>

      {/* Output Handle - matrix data flows out */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-amber-500 border-2 border-amber-700"
        style={{ right: '-6px' }}
      />
    </div>
  );
});

MatrixNode.displayName = 'MatrixNode';

export default MatrixNode;
