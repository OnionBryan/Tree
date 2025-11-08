import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const GateNode = memo(({ data, selected }) => {
  // Determine number of inputs dynamically
  const inputCount = data.inputs?.length || data.expectedInputs || 2;

  const getGateSymbol = () => {
    switch (data.logicType) {
      case 'and': return '∧';
      case 'or': return '∨';
      case 'nand': return '⊼';
      case 'nor': return '⊽';
      case 'xor': return '⊕';
      case 'xnor': return '⊙';
      case 'not': return '¬';
      case 'majority': return 'M';
      case 'threshold': return 'θ';
      default: return data.logicType?.toUpperCase() || 'GATE';
    }
  };

  const getGateColor = () => {
    switch (data.logicType) {
      case 'and':
      case 'nand':
        return 'bg-amber-500';
      case 'or':
      case 'nor':
        return 'bg-blue-500';
      case 'xor':
      case 'xnor':
        return 'bg-green-500';
      case 'not':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Calculate handle positions accounting for 45° rotation
  // For a rotated square, input handles should be on the top-left edge
  // and output handle should be on the bottom-right edge
  const getInputHandleStyle = (index) => {
    // Spread inputs along the top-left diagonal edge
    const percent = ((index + 1) * 100) / (inputCount + 1);

    // For the rotated square, we need to position along the actual visible top edge
    // which is the diagonal from left to top in the rotated coordinate system
    return {
      top: `${percent * 0.4}%`, // Move down as we go right
      left: `${percent * 0.4}%`  // Move right as we progress
    };
  };

  return (
    <div
      className={`relative flex items-center justify-center w-20 h-20 rounded-lg transform rotate-45
        ${getGateColor()} ${selected ? 'ring-4 ring-white ring-opacity-60' : ''}
        hover:scale-110 transition-all duration-200 shadow-lg`}
    >
      {/* Dynamically render multiple input handles */}
      {Array.from({ length: inputCount }).map((_, i) => (
        <Handle
          key={`input-${i}`}
          type="target"
          position={Position.Left}
          id={`input-${i}`}
          className="w-3 h-3 bg-white border-2 border-gray-800"
          style={{
            top: `${((i + 1) * 100) / (inputCount + 1)}%`,
            left: '-6px'
          }}
        />
      ))}

      <div className="transform -rotate-45 text-white font-bold text-xl">
        {getGateSymbol()}
      </div>

      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 -rotate-45
        text-xs font-semibold text-gray-700 bg-white px-2 py-0.5 rounded shadow">
        {data.label || data.logicType?.toUpperCase()}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-white border-2 border-gray-800"
        style={{ right: '-6px' }}
      />
    </div>
  );
});

GateNode.displayName = 'GateNode';

export default GateNode;