/**
 * ConnectionTooltip Component
 * Displays connection metadata when hovering over connections
 * Shows threshold, weight, port indices, and node names
 */
import React from 'react';

export default function ConnectionTooltip({
  connection,
  fromNode,
  toNode,
  position,
  visible
}) {
  if (!visible || !connection || !fromNode || !toNode) {
    return null;
  }

  const tooltipStyle = {
    position: 'fixed',
    left: `${position.x + 10}px`,
    top: `${position.y + 10}px`,
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '12px',
    color: '#fff',
    zIndex: 10000,
    pointerEvents: 'none',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
    maxWidth: '250px'
  };

  const labelStyle = {
    color: '#9ca3af',
    marginRight: '6px',
    fontWeight: '500'
  };

  const valueStyle = {
    color: '#e5e7eb',
    fontWeight: '400'
  };

  const rowStyle = {
    marginBottom: '4px',
    display: 'flex',
    justifyContent: 'space-between',
    gap: '8px'
  };

  const dividerStyle = {
    height: '1px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    margin: '6px 0'
  };

  // Format threshold value
  const formatThreshold = (value) => {
    if (value === null || value === undefined) return 'Not set';
    if (typeof value === 'number') return value.toFixed(3);
    return String(value);
  };

  // Get gate type display name
  const getGateTypeDisplay = (type) => {
    const typeMap = {
      'decision': 'Decision',
      'and': 'AND',
      'or': 'OR',
      'not': 'NOT',
      'xor': 'XOR',
      'nand': 'NAND',
      'nor': 'NOR',
      'fuzzy': 'Fuzzy'
    };
    return typeMap[type] || type;
  };

  return (
    <div style={tooltipStyle}>
      {/* Connection Header */}
      <div style={{ marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>
        Connection Details
      </div>

      <div style={dividerStyle} />

      {/* From Node */}
      <div style={rowStyle}>
        <span style={labelStyle}>From:</span>
        <span style={valueStyle}>
          {fromNode.label || getGateTypeDisplay(fromNode.type)} (Port {connection.fromPort})
        </span>
      </div>

      {/* To Node */}
      <div style={rowStyle}>
        <span style={labelStyle}>To:</span>
        <span style={valueStyle}>
          {toNode.label || getGateTypeDisplay(toNode.type)} (Port {connection.toPort})
        </span>
      </div>

      <div style={dividerStyle} />

      {/* Threshold */}
      <div style={rowStyle}>
        <span style={labelStyle}>Threshold:</span>
        <span style={valueStyle}>{formatThreshold(connection.threshold)}</span>
      </div>

      {/* Weight (if present) */}
      {connection.weight !== undefined && (
        <div style={rowStyle}>
          <span style={labelStyle}>Weight:</span>
          <span style={valueStyle}>{connection.weight.toFixed(3)}</span>
        </div>
      )}

      {/* Connection Label (if present) */}
      {connection.label && (
        <div style={rowStyle}>
          <span style={labelStyle}>Label:</span>
          <span style={valueStyle}>{connection.label}</span>
        </div>
      )}

      {/* Connection ID */}
      <div style={dividerStyle} />
      <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>
        ID: {connection.id}
      </div>
    </div>
  );
}
