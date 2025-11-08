import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const HybridNode = memo(({ data, selected }) => {
  // Extract Likert metadata
  const min = data.metadata?.min || data.inputSchema?.min || 1;
  const max = data.metadata?.max || data.inputSchema?.max || 7;
  const step = data.metadata?.step || data.inputSchema?.step || 1;
  const trigger = data.metadata?.trigger || data.conditionalLogic?.trigger || 'SIGMA';
  const sigmaMultiplier = data.metadata?.sigmaMultiplier || data.conditionalLogic?.sigmaMultiplier || 1.0;

  const rangeText = `[${min} to ${max}]`;
  const stepText = step === 1 ? '' : ` (±${step})`;
  const triggerText = trigger === 'SIGMA' ? `${sigmaMultiplier}σ` : trigger;

  return (
    <div
      className={`relative flex flex-col items-center justify-center w-28 h-28 rounded-lg
        bg-teal-500 ${selected ? 'ring-4 ring-white ring-opacity-60' : ''}
        hover:scale-110 transition-all duration-200 shadow-lg border-2 border-teal-700`}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-white border-2 border-gray-800"
        style={{ top: '-6px' }}
      />

      {/* Symbol - combined Likert + Semantic */}
      <div className="flex items-center gap-1 text-2xl mb-1">
        <span>📊</span>
        <span>💬</span>
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

      {/* Trigger indicator */}
      <div className="text-white text-xs font-bold bg-teal-700 px-2 py-0.5 rounded mt-1">
        {triggerText}
      </div>

      {/* Label */}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2
        text-xs font-semibold text-gray-700 bg-white px-2 py-0.5 rounded shadow whitespace-nowrap">
        {data.label || data.name || 'Hybrid Gate'}
      </div>

      {/* Output handle - dual output for hybrid */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="numeric"
        className="w-3 h-3 bg-white border-2 border-gray-800"
        style={{ bottom: '-6px', left: '35%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="semantic"
        className="w-3 h-3 bg-white border-2 border-gray-800"
        style={{ bottom: '-6px', right: '35%' }}
      />
    </div>
  );
});

HybridNode.displayName = 'HybridNode';

export default HybridNode;
