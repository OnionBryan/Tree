import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const SemanticNode = memo(({ data, selected }) => {
  // Extract semantic metadata
  const minLength = data.metadata?.minLength || 10;
  const keywords = data.metadata?.keywords || [];
  const sentimentRequired = data.metadata?.sentimentRequired || false;

  const keywordText = keywords.length > 0 ? `${keywords.length} keywords` : 'Any text';
  const minLengthText = `≥${minLength} chars`;

  return (
    <div
      className={`relative flex flex-col items-center justify-center w-24 h-24 rounded-lg
        bg-pink-500 ${selected ? 'ring-4 ring-white ring-opacity-60' : ''}
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
        💬
      </div>

      {/* Info display */}
      <div className="text-white text-xs font-semibold">
        {keywordText}
      </div>
      <div className="text-white text-xs opacity-80">
        {minLengthText}
      </div>
      {sentimentRequired && (
        <div className="text-white text-xs font-bold bg-pink-700 px-1 rounded mt-1">
          + Sentiment
        </div>
      )}

      {/* Label */}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2
        text-xs font-semibold text-gray-700 bg-white px-2 py-0.5 rounded shadow whitespace-nowrap">
        {data.label || data.name || 'Semantic'}
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-white border-2 border-gray-800"
        style={{ bottom: '-6px' }}
      />
    </div>
  );
});

SemanticNode.displayName = 'SemanticNode';

export default SemanticNode;
