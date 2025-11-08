import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const LikertNode = memo(({ data, selected }) => {
  // Extract Likert metadata
  const min = data.metadata?.min || data.inputSchema?.min || 1;
  const max = data.metadata?.max || data.inputSchema?.max || 7;
  const step = data.metadata?.step || data.inputSchema?.step || 1;
  const outputPaths = data.metadata?.outputPaths || [];

  const rangeText = `[${min} to ${max}]`;
  const stepText = step === 1 ? '' : ` (±${step})`;

  // If output paths are defined, show count instead of single output
  const hasMultipleOutputs = outputPaths.length > 0;

  return (
    <div
      className={`relative flex flex-col items-center justify-center w-24 h-24 rounded-lg
        bg-cyan-500 ${selected ? 'ring-4 ring-white ring-opacity-60' : ''}
        hover:scale-110 transition-all duration-200 shadow-lg`}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-white border-2 border-gray-800"
        style={{ top: '-6px' }}
      />

      {/* Symbol */}
      <div className="text-white font-bold text-3xl mb-1">
        📊
      </div>

      {/* Range display */}
      <div className="text-white text-xs font-semibold">
        {rangeText}
      </div>
      {stepText && (
        <div className="text-white text-xs opacity-80">
          {stepText}
        </div>
      )}

      {/* Output path count */}
      {hasMultipleOutputs && (
        <div className="text-white text-xs font-bold bg-cyan-700 px-1 rounded mt-1">
          {outputPaths.length} paths
        </div>
      )}

      {/* Label */}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2
        text-xs font-semibold text-gray-700 bg-white px-2 py-0.5 rounded shadow whitespace-nowrap">
        {data.label || data.name || 'Likert Scale'}
      </div>

      {/* Output handles - multiple if paths are configured */}
      {hasMultipleOutputs ? (
        outputPaths.map((path, idx) => (
          <Handle
            key={path.id}
            type="source"
            position={Position.Bottom}
            id={`output-${idx}`}
            className="w-3 h-3 bg-white border-2 border-gray-800"
            style={{
              bottom: '-6px',
              left: `${((idx + 1) * 100) / (outputPaths.length + 1)}%`
            }}
            title={`${path.label}: ${path.rangeMin} to ${path.rangeMax}`}
          />
        ))
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-white border-2 border-gray-800"
          style={{ bottom: '-6px' }}
        />
      )}
    </div>
  );
});

LikertNode.displayName = 'LikertNode';

export default LikertNode;
